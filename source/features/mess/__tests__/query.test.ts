import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody, SourceFetchError, type Jrd} from '@frogpond/data-sources'
import posts from './fixtures/posts.json'
import categories from './fixtures/categories.json'
import profiles from './fixtures/profiles-390.json'
import varietyPosts from './fixtures/variety-posts.json'
import crosswordPlaylist from './fixtures/crossword-playlist-posts.json'
import springPosts from './fixtures/issue-posts.json'
import {parseLightPosts} from '../lib/issues'
import {parseMessCategories, parseMessPosts} from '../lib/posts'
import {QueryClient, onlineManager} from '@tanstack/react-query'
import {queryClient} from '../../../init/tanstack-query'
import {
	MissingMessStoryError,
	messCategoryOptions,
	messFeedOptions,
	messPlaylistPageOptions,
	messSeriesOptions,
	messStoryOptions,
	staffProfileOptions,
	messIssueOptions,
	messIssuesOptions,
} from '../query'
import {messKeys} from '../lib/keys'
import type {LightPost, MessStory, SpotifyRef} from '../types'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<typeof fetchSourceBody>

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal; queryKey: unknown}) => Promise<T>
	return queryFn({signal: new AbortController().signal, queryKey: []})
}

/** Runs an infinite query's page fetch for one page. */
function runPage<T>(options: {queryFn?: unknown}, pageParam: number): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal; pageParam: number}) => Promise<T>
	return queryFn({signal: new AbortController().signal, pageParam})
}

/** This spring's posts as the issue list parses them. */
const spring = parseLightPosts(springPosts, parseMessCategories(categories))

afterEach(() => {
	jest.clearAllMocks()
	// The queries share the app's client, so a cached category tree would leak into the next test.
	queryClient.clear()
})

/** The hrefs `fetchSourceBody` was asked for, in order. */
function fetchedHrefs(): string[] {
	return mockBody.mock.calls.map((call) => call[0])
}

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		Promise.resolve(href.includes('/categories') ? categories : answer(href)),
	)
}

type RawPost = (typeof varietyPosts)[number]

/** A fixture Variety post, found by id. */
function rawPost(id: number): RawPost {
	let post = varietyPosts.find((p) => p.id === id)
	if (!post) throw new Error(`no fixture post ${id}`)
	return post
}

/** A copy of a fixture post under another id and title. */
function retitled(id: number, from: number, title: string): RawPost {
	let post = rawPost(from)
	return {...post, id, title: {...post.title, rendered: title}}
}

/** A fixture Variety post as the app parses it. */
function story(id: number): MessStory {
	let [parsed] = parseMessPosts([rawPost(id)], parseMessCategories(categories))
	if (!parsed) throw new Error(`fixture post ${id} did not parse`)
	return parsed
}

describe('messFeedOptions', () => {
	// The server's manifest still lists the Mess as ccc-server feed-items. The
	// Mess screen accepts only WordPress, so it falls back to the bundled entry.
	test('reads the WordPress feed even when the live manifest lists feed-items', async () => {
		mockManifest.mockResolvedValue({
			links: [
				{
					rel: 'https://frogpond.tech/rel/news',
					href: 'news/named/mess',
					type: 'application/vnd.frogpond.feed-items+json',
					titles: {und: 'The Olaf Messenger'},
					properties: {'https://frogpond.tech/ns/id': 'mess'},
				},
			],
		} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categories : posts),
		)

		let stories = await run<Array<{id: number}>>(messFeedOptions)

		expect(stories.map((s) => s.id)).toStrictEqual([36859, 36911, 36885, 36904, 36843])
		let hrefs = mockBody.mock.calls.map((call) => call[0])
		expect(hrefs).toContain('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true')
		expect(hrefs).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/categories?per_page=100&_fields=id,name,parent',
		)
	})

	test('fails when the feed cannot be fetched', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await expect(run(messFeedOptions)).rejects.toThrow('offline')
	})
})

describe('staffProfileOptions', () => {
	test('asks for that writer and keeps the newest year', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockResolvedValue(profiles)

		let profile = await run<{year: string} | null>(staffProfileOptions(390))

		expect(profile?.year).toBe('2025-2026')
		expect(mockBody.mock.calls[0]?.[0]).toBe(
			'https://olafmessenger.com/wp-json/wp/v2/staff_profile?staff_name=390&_embed=true',
		)
	})

	test('gives null for a writer with no profile', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockResolvedValue([])
		expect(await run(staffProfileOptions(1))).toBeNull()
	})
})

describe('messStoryOptions', () => {
	test('fetches the one post and parses it', async () => {
		serve(() => posts[0])

		let fetched = await run<MessStory>(messStoryOptions(36859))

		expect(fetched.id).toBe(36859)
		expect(fetched.section).toBe('News')
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts/36859?_embed=true',
		)
	})

	test('retries a failed fetch, but not a post that holds no story', () => {
		let retry = messStoryOptions(1).retry as (count: number, error: Error) => boolean
		expect(retry(0, new Error('offline'))).toBe(true)
		expect(retry(3, new Error('offline'))).toBe(false)
		expect(retry(0, new MissingMessStoryError(1))).toBe(false)
	})

	test('fails when the post parses to no story', async () => {
		serve(() => [])
		await expect(run(messStoryOptions(1))).rejects.toThrow('no Mess story 1')
	})
})

describe('messCategoryOptions', () => {
	test("fetches the section's newest posts", async () => {
		serve(() => varietyPosts)

		let stories = await run<MessStory[]>(messCategoryOptions(23))

		expect(stories.map((s) => s.id)).toStrictEqual(varietyPosts.map((p) => p.id))
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?categories=23&per_page=30&_embed=true',
		)
	})

	test('shares one category tree with the feed', async () => {
		serve((href) => (href.includes('categories=23') ? varietyPosts : posts))

		await run(messFeedOptions)
		await run(messCategoryOptions(23))

		expect(fetchedHrefs().filter((href) => href.includes('/categories'))).toHaveLength(1)
	})
})

describe('messSeriesOptions', () => {
	test('gathers the other episodes of a titled series', async () => {
		serve(() => [
			rawPost(36819),
			retitled(1, 36819, 'Mouse friends episode 2: Mary! Gold!'),
			rawPost(34645),
			retitled(2, 34645, 'Mouse Friends Episode One: “I’m Lucky to Bicker With You”'),
		])

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(36819)))

		// Spelled as the newest other episode spells it.
		expect(series.title).toBe('More Mouse friends')
		expect(series.stories.map((s) => s.id)).toStrictEqual([1, 2])
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?categories=63&per_page=30&_embed=true',
		)
	})

	test('reads the episodes from the column list’s cache', async () => {
		serve(() => [])
		let episode = parseMessPosts(
			[retitled(1, 36819, 'Mouse friends episode 2: Mary! Gold!')],
			parseMessCategories(categories),
		)
		queryClient.setQueryData(messKeys.category(63), episode)

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(36819)))

		expect(series.stories.map((s) => s.id)).toStrictEqual([1])
		expect(fetchedHrefs().some((href) => href.includes('/posts'))).toBe(false)
	})

	test('heads the row with the newest episode’s spelling of the series', async () => {
		serve(() => [
			retitled(1, 36819, 'Mouse Friends episode 3: cheese'),
			retitled(2, 36819, 'Mouse friends episode 2: Mary! Gold!'),
		])

		let series = await run<{title: string; stories: MessStory[]}>(
			messSeriesOptions({...story(36819), title: 'mouse friends episode 1: hello'}),
		)

		expect(series.title).toBe('More Mouse Friends')
	})

	test('shows at most six other episodes', async () => {
		serve(() =>
			Array.from({length: 8}, (_, index) =>
				retitled(index + 1, 36819, `Mouse Friends episode ${index + 1}: more`),
			),
		)

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(36819)))

		expect(series.stories.map((s) => s.id)).toStrictEqual([1, 2, 3, 4, 5, 6])
	})

	test('fails when the column cannot be fetched', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			href.includes('/categories')
				? Promise.resolve(categories)
				: Promise.reject(new Error('offline')),
		)

		await expect(run(messSeriesOptions(story(36819)))).rejects.toThrow('offline')
	})

	test("falls back to the writer's other work when a series has no other episodes", async () => {
		serve((href) => (href.includes('staff_name=') ? [rawPost(34645)] : [rawPost(36819)]))

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(36819)))

		expect(series.title).toBe('More by Juliet Stouffer')
		expect(series.stories.map((s) => s.id)).toStrictEqual([34645])
	})

	test("gives a story without a series its writer's other work in that column", async () => {
		serve(() => [rawPost(34645), rawPost(36819)])

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(34645)))

		expect(series.title).toBe('More by Juliet Stouffer')
		expect(series.stories.map((s) => s.id)).toStrictEqual([36819])
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?categories=63&staff_name=381&per_page=7&_embed=true',
		)
		expect(fetchedHrefs().some((href) => href.includes('per_page=30'))).toBe(false)
	})

	test('gives an empty list when the writer has nothing else in the column', async () => {
		serve(() => [rawPost(34645)])

		let series = await run<{title: string; stories: MessStory[]}>(messSeriesOptions(story(34645)))

		expect(series.stories).toStrictEqual([])
	})

	test('gives nothing for a story with neither a series nor a writer', async () => {
		serve(() => [])

		let series = await run<{title: string; stories: MessStory[]}>(
			messSeriesOptions({...story(34645), bylines: []}),
		)

		expect(series).toStrictEqual({title: '', stories: []})
		expect(fetchedHrefs().some((href) => href.includes('/posts'))).toBe(false)
	})

	test('gives nothing for a story with no column', async () => {
		serve(() => [])

		let series = await run<{title: string; stories: MessStory[]}>(
			messSeriesOptions({...story(34645), column: null}),
		)

		expect(series).toStrictEqual({title: '', stories: []})
		expect(fetchedHrefs().some((href) => href.includes('/posts'))).toBe(false)
	})
})

const PLAYLIST_PAGE = readFileSync(join(__dirname, 'fixtures/playlist-page-36532.html'), 'utf8')

/** A fixture Crossword or Playlist post as the app parses it. */
function playlistStory(id: number): MessStory {
	let [parsed] = parseMessPosts(
		crosswordPlaylist.filter((p) => p.id === id),
		parseMessCategories(categories),
	)
	if (!parsed) throw new Error(`fixture post ${id} did not parse`)
	return parsed
}

describe('messPlaylistPageOptions', () => {
	test("reads the playlist from the post's web page, fetched as text", async () => {
		mockBody.mockResolvedValue(PLAYLIST_PAGE)

		let spotify = await run<SpotifyRef | null>(messPlaylistPageOptions(playlistStory(36532)))

		expect(spotify).toStrictEqual({kind: 'playlist', id: '5dJFJNxZlxoRbwIgqCTxWk'})
		expect(mockBody).toHaveBeenCalledWith(
			'https://olafmessenger.com/36532/variety/spotify-playlist-summer-kind-of/',
			expect.any(AbortSignal),
			'Olaf Messenger page',
			'text',
		)
	})

	test('gives null for a page with no playlist', async () => {
		mockBody.mockResolvedValue('<html><body><p>No player here.</p></body></html>')
		expect(await run(messPlaylistPageOptions(playlistStory(36532)))).toBeNull()
	})

	test('fails when the page cannot be fetched', async () => {
		mockBody.mockRejectedValue(new Error('offline'))
		await expect(run(messPlaylistPageOptions(playlistStory(36532)))).rejects.toThrow('offline')
	})

	test('fails at once when offline, so the page can fall back, rather than waiting for the network', async () => {
		mockBody.mockRejectedValue(new Error('offline'))
		let client = new QueryClient()
		onlineManager.setOnline(false)
		try {
			await expect(client.query(messPlaylistPageOptions(playlistStory(36532)))).rejects.toThrow(
				'offline',
			)
		} finally {
			onlineManager.setOnline(true)
			client.clear()
		}
	})

	test('is cached per story', () => {
		expect(messPlaylistPageOptions(playlistStory(36532)).queryKey).toStrictEqual(
			messKeys.playlistPage(36532),
		)
	})
})

describe('messIssuesOptions', () => {
	test('asks for a page of light posts, and reads them against the category tree', async () => {
		serve((href) => (href.includes('/media') ? [] : springPosts.slice(0, 100)))

		let page = await runPage<LightPost[]>(messIssuesOptions, 2)

		expect(page).toStrictEqual(spring.slice(0, 100))
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?per_page=100&page=2&_fields=id,date,title,categories,featured_media',
		)
	})

	test("looks up the page's photos in one request", async () => {
		serve((href) =>
			href.includes('/media')
				? [{id: 36902, source_url: 'https://olafmessenger.com/grant.png'}]
				: springPosts.slice(0, 100),
		)

		let page = await runPage<LightPost[]>(messIssuesOptions, 1)

		let media = fetchedHrefs().filter((href) => href.includes('/media'))
		expect(media).toHaveLength(1)
		expect(media[0]).toMatch(
			/\/wp-json\/wp\/v2\/media\?include=(\d+,)*36902(,\d+)*&per_page=100&_fields=id,source_url$/u,
		)
		expect(page.find((post) => post.id === 36896)?.photoUrl).toBe(
			'https://olafmessenger.com/grant.png',
		)
	})

	test.each([
		['cannot be reached', () => Promise.reject(new Error('offline'))],
		['answer in a shape it cannot read', () => ({code: 'rest_forbidden'})],
	])('still gives the page when its photos %s', async (_name, answer) => {
		serve((href) => (href.includes('/media') ? answer() : springPosts.slice(0, 100)))

		let page = await runPage<LightPost[]>(messIssuesOptions, 1)

		expect(page).toHaveLength(100)
		expect(page.every((post) => post.photoUrl === null)).toBe(true)
	})

	// WordPress answers 400 for a page past the last, which it asks for when the post count is a
	// multiple of a hundred, since the last page is then full.
	test("reads WordPress's answer for a page past the last as an empty last page", async () => {
		serve(() =>
			Promise.reject(new SourceFetchError('Olaf Messenger issues fetch failed: 400', 400)),
		)

		let page = await runPage<LightPost[]>(messIssuesOptions, 54)

		expect(page).toStrictEqual([])
		expect(messIssuesOptions.getNextPageParam(page, [page], 54, [54])).toBeUndefined()
	})

	test('still fails a page on any other error', async () => {
		serve(() =>
			Promise.reject(new SourceFetchError('Olaf Messenger issues fetch failed: 500', 500)),
		)

		await expect(runPage<LightPost[]>(messIssuesOptions, 2)).rejects.toThrow('failed: 500')
	})

	test('asks for another page after a full one, and none after a short one', () => {
		let full = spring.slice(0, 100)
		let short = spring.slice(200)
		expect(messIssuesOptions.getNextPageParam(full, [full], 1, [1])).toBe(2)
		expect(
			messIssuesOptions.getNextPageParam(short, [full, full, short], 3, [1, 2, 3]),
		).toBeUndefined()
	})
})

describe('messIssueOptions', () => {
	test("fetches an older issue's stories, from its day to the next issue's", async () => {
		serve(() => posts)

		let stories = await run<MessStory[]>(
			messIssueOptions({after: '2026-03-24T23:59:59', before: '2026-04-29T00:00:00', count: 5}),
		)

		expect(stories.map((s) => s.id)).toStrictEqual([36859, 36911, 36885, 36904, 36843])
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?after=2026-03-24T23:59:59&before=2026-04-29T00:00:00&per_page=100&_embed=true',
		)
	})

	test('runs the newest issue to now', async () => {
		serve(() => posts)

		await run(messIssueOptions({after: '2026-05-11T23:59:59', before: null, count: 11}))

		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts?after=2026-05-11T23:59:59&per_page=100&_embed=true',
		)
	})

	test('keys an issue by its range and story count, and keeps it for a day', () => {
		let options = messIssueOptions({after: '2026-05-11T23:59:59', before: null, count: 11})
		expect(options.queryKey).toStrictEqual(['mess', 'issue', '2026-05-11T23:59:59', null, 11])
		expect(options.staleTime).toBe(24 * 60 * 60 * 1000)
	})
})
