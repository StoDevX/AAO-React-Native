import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import posts from './fixtures/posts.json'
import categories from './fixtures/categories.json'
import profiles from './fixtures/profiles-390.json'
import varietyPosts from './fixtures/variety-posts.json'
import {parseMessCategories, parseMessPosts} from '../lib/posts'
import {queryClient} from '../../../init/tanstack-query'
import {
	messCategoryOptions,
	messFeedOptions,
	messSeriesOptions,
	messStoryOptions,
	staffProfileOptions,
} from '../query'
import type {MessStory} from '../types'

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
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

function run<T>(options: {queryFn?: unknown}): Promise<T> {
	let queryFn = options.queryFn as (context: {signal: AbortSignal; queryKey: unknown}) => Promise<T>
	return queryFn({signal: new AbortController().signal, queryKey: []})
}

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

	test('gives nothing for a story with no column', async () => {
		serve(() => [])

		let series = await run<{title: string; stories: MessStory[]}>(
			messSeriesOptions({...story(34645), column: null}),
		)

		expect(series).toStrictEqual({title: '', stories: []})
		expect(fetchedHrefs().some((href) => href.includes('/posts'))).toBe(false)
	})
})
