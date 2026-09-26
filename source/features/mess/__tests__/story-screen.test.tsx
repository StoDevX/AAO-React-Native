import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import * as React from 'react'
import {Linking} from 'react-native'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {openUrl} from '@frogpond/open-url'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import categories from './fixtures/categories.json'
import posts from './fixtures/posts.json'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {flushQueryNotifications} from '../../../testing/query-notifications'
import {StoryScreen} from '../story-screen'
import {messKeys} from '../query'
import {useMessStore} from '../store'
import {ZODIAC_SIGNS} from '../lib/zodiac'
import type {MessStory, StaffProfile} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
// The library's own stand-in: zero insets, where the real hook needs a native provider.
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('react-native-webview', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./webview-mock') as typeof import('./webview-mock')
})

// The feed's fetches, so an uncached feed never reaches a network Jest does not have.
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const STORY: MessStory = {
	id: 36911,
	title: 'Cows, Comments and Confessions',
	excerpt: 'E',
	link: 'https://olafmessenger.com/36911/',
	published: '2026-04-29T22:24:19.000Z',
	section: 'Opinions',
	column: null,
	featured: false,
	bylines: [
		{id: 423, name: 'Ashlyn Wuench'},
		{id: 392, name: 'Kenzie Nguyen'},
	],
	photo: null,
	blocks: [
		{type: 'paragraph', runs: [{text: 'The petition was delivered on Tuesday.'}]},
		{type: 'paragraph', runs: [{text: 'Body text.'}]},
	],
	layout: {kind: 'article'},
}

/** An Artwork post: the REST API gives it no body at all. */
const ARTWORK: MessStory = {
	...STORY,
	id: 36950,
	title: 'Spring Sketches',
	link: 'https://olafmessenger.com/36950/',
	blocks: [],
}

/** A Horoscopes post; its readings live in its layout, and it has no blocks to draw. */
const HOROSCOPES: MessStory = {
	...STORY,
	id: 36518,
	title: 'Horoscopes',
	link: 'https://olafmessenger.com/36518/',
	blocks: [],
	layout: {
		kind: 'horoscopes',
		intro: [],
		signs: ZODIAC_SIGNS.map((sign) => ({sign, reading: [[{text: `${sign} reading`}]]})),
	},
}

const COMIC_IMAGE = {url: 'https://olafmessenger.com/comic.png', width: 1000, height: 1400}

/** A Comic post: its image is the body, and a line of text follows it. */
const COMIC: MessStory = {
	...STORY,
	id: 36819,
	title: 'Mouse Friends: sunsets of life',
	link: 'https://olafmessenger.com/36819/',
	section: 'Variety',
	column: 'Comic',
	photo: {...COMIC_IMAGE, caption: ''},
	blocks: [{type: 'paragraph', runs: [{text: 'The mice watch the sun go down.'}]}],
	layout: {kind: 'image', image: COMIC_IMAGE},
}

/** A Poetry post: its lines live in its layout. */
const POEM: MessStory = {
	...STORY,
	id: 36280,
	title: 'A room in Oklahoma',
	link: 'https://olafmessenger.com/36280/',
	section: 'Variety',
	column: 'Poetry',
	blocks: [{type: 'paragraph', runs: [{text: 'My bitter yellow comes with me on walks.'}]}],
	layout: {
		kind: 'poem',
		stanzas: [
			[
				{indent: 0, runs: [{text: 'My bitter yellow comes with me on walks.'}]},
				{indent: 1, runs: [{text: 'It hums at the gate.'}]},
			],
		],
	},
}

const PUZZLE = {
	id: 'af644d78',
	set: 'c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4',
}

/** A Crossword post: its puzzle lives in its layout, and a line of text follows the button. */
const CROSSWORD: MessStory = {
	...STORY,
	id: 36814,
	title: 'Crossword: Sunrise & Sunset',
	link: 'https://olafmessenger.com/36814/variety/crossword/crossword-sunrise-sunset/',
	section: 'Variety',
	column: 'Crossword',
	blocks: [{type: 'paragraph', runs: [{text: 'Answers in next week’s issue.'}]}],
	layout: {kind: 'crossword', puzzle: PUZZLE},
}

const PLAYLIST_PHOTO = {
	url: 'https://olafmessenger.com/wp-content/uploads/2020/05/AE_Quarentunes_Anna_Weimholt_04_30-1.png',
	width: 386,
	height: 386,
}

/** A Playlist post whose body names its playlist, with a writer's note and a featured image. */
const PLAYLIST: MessStory = {
	...STORY,
	id: 30713,
	title: 'Spotify Playlist: best of grammy noms 2022',
	link: 'https://olafmessenger.com/30713/variety/spotify-playlist-best-of-grammy-noms-2022/',
	section: 'Variety',
	column: 'Playlist',
	photo: {...PLAYLIST_PHOTO, caption: ''},
	blocks: [{type: 'paragraph', runs: [{text: 'While you listen, check out my picks.'}]}],
	layout: {kind: 'playlist', spotify: {kind: 'playlist', id: '6bscojNnnO6nZcAnnXI1Cs'}},
}

/** A Playlist post with an empty body, whose playlist is on its web page. */
const PAGE_PLAYLIST: MessStory = {
	...STORY,
	id: 36532,
	title: 'Spotify playlist: summer (kind of)',
	link: 'https://olafmessenger.com/36532/variety/spotify-playlist-summer-kind-of/',
	section: 'Variety',
	column: 'Playlist',
	blocks: [],
	layout: {kind: 'playlist', spotify: null},
}

const PLAYLIST_PAGE = readFileSync(join(__dirname, 'fixtures/playlist-page-36532.html'), 'utf8')

const PROFILE: StaffProfile = {
	name: 'Kenzie Nguyen',
	bio: 'Kenzie is a senior.',
	photo: null,
	year: '2025-2026',
}

let queryClient: QueryClient
/** iOS's own link opener, which "Open in Spotify" hands its link to. */
let openInIOS: jest.Spied<typeof Linking.openURL>

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.feed, [
		STORY,
		ARTWORK,
		HOROSCOPES,
		COMIC,
		POEM,
		CROSSWORD,
		PLAYLIST,
		PAGE_PLAYLIST,
	])
	openInIOS = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
	useMessStore.setState({lastSign: null})
	// Ashlyn has no profile; Kenzie has one.
	queryClient.setQueryData(messKeys.profile(423), null)
	queryClient.setQueryData(messKeys.profile(392), PROFILE)
})

afterEach(() => {
	queryClient.clear()
	// The feed fetches its categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
	jest.restoreAllMocks()
})

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** The props of every rendered host element of `type`, depth first. */
function hostProps(node: Node | Node[] | null, type: string): Array<Record<string, unknown>> {
	if (node === null) return []
	if (Array.isArray(node)) return node.flatMap((n) => hostProps(n, type))
	let children = (node.children ?? []).filter((child): child is Node => typeof child !== 'string')
	return [...(node.type === type ? [node.props] : []), ...hostProps(children, type)]
}

/** The hrefs `fetchSourceBody` was asked for, in order. */
function fetchedHrefs(): string[] {
	return mockBody.mock.calls.map((call) => call[0])
}

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		href.includes('/categories') ? Promise.resolve(categories) : Promise.resolve(answer(href)),
	)
}

function renderStory(id: number) {
	return render(
		<QueryClientProvider client={queryClient}>
			<StoryScreen id={id} />
		</QueryClientProvider>,
	)
}

describe('StoryScreen', () => {
	test('reads a story in the cached feed without fetching the single post', async () => {
		await renderStory(36911)
		await act(flushQueryNotifications)

		expect(screen.getByText('Cows, Comments and Confessions')).toBeTruthy()
		expect(mockManifest).not.toHaveBeenCalled()
		expect(mockBody).not.toHaveBeenCalled()
	})

	test('fetches a story that is not in the feed on its own', async () => {
		serve((href) => (href.includes('/posts/36859') ? posts[0] : []))
		await renderStory(36859)

		expect(
			await screen.findByText(
				'Student workers deliver petition urging St. Olaf to reverse work award cap policy',
			),
		).toBeTruthy()
		expect(fetchedHrefs()).toContain(
			'https://olafmessenger.com/wp-json/wp/v2/posts/36859?_embed=true',
		)
	})

	test('keeps a story from outside the feed when a refetch of the feed fails', async () => {
		serve((href) => (href.includes('/posts/36859') ? posts[0] : []))
		await renderStory(36859)
		let headline =
			'Student workers deliver petition urging St. Olaf to reverse work award cap policy'
		expect(await screen.findByText(headline)).toBeTruthy()

		// The feed still holds its earlier stories, but its next fetch fails.
		mockBody.mockImplementation((href) =>
			href.includes('/posts/36859')
				? Promise.resolve(posts[0])
				: Promise.reject(new Error('offline')),
		)
		await act(() => queryClient.refetchQueries({queryKey: messKeys.feed}))
		await act(flushQueryNotifications)

		expect(queryClient.getQueryState(messKeys.feed)?.status).toBe('error')
		expect(screen.getByText(headline)).toBeTruthy()
	})

	test('offers Try Again when a story outside the feed fails to load', async () => {
		// A failed fetch is retried with a growing delay, which fake timers skip.
		jest.useFakeTimers()
		try {
			mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
			mockBody.mockRejectedValue(new Error('offline'))
			await renderStory(1)

			expect(await screen.findByText('Try Again', {}, {timeout: 20_000})).toBeTruthy()
			expect(screen.queryByText('Story unavailable')).toBeNull()
		} finally {
			jest.useRealTimers()
		}
	})

	test('says a story is unavailable when its post comes back empty, without retrying', async () => {
		// The app's own retry default, which the query must override for a missing story.
		queryClient.clear()
		queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity}}})
		queryClient.setQueryData(messKeys.feed, [STORY])
		serve(() => [])
		await renderStory(1)

		expect(await screen.findByText('Story unavailable')).toBeTruthy()
		expect(screen.queryByText('Try Again')).toBeNull()
		expect(fetchedHrefs().filter((href) => href.includes('/posts/1?'))).toHaveLength(1)
	})

	test('shows the loading view while the feed is on its way', async () => {
		queryClient.removeQueries({queryKey: messKeys.feed})
		mockManifest.mockReturnValue(new Promise(() => undefined))
		await renderStory(36911)

		expect(screen.getByText('Loading…')).toBeTruthy()
		expect(screen.queryByText('Story unavailable')).toBeNull()
	})

	test('offers Try Again when the feed fails', async () => {
		queryClient.removeQueries({queryKey: messKeys.feed})
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await renderStory(36911)

		expect(await screen.findByText('Try Again')).toBeTruthy()
		expect(screen.queryByText('Story unavailable')).toBeNull()
	})

	test('reads a freshly cached feed without fetching it again', async () => {
		// The app's own default: data goes stale at once unless a query says otherwise.
		// The client from beforeEach is cleared first; its cache timers would keep Jest running.
		queryClient.clear()
		queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
		queryClient.setQueryData(messKeys.feed, [STORY, ARTWORK])
		queryClient.setQueryData(messKeys.profile(423), null)
		queryClient.setQueryData(messKeys.profile(392), PROFILE)
		mockManifest.mockReturnValue(new Promise(() => undefined))
		await renderStory(36911)
		await act(flushQueryNotifications)

		expect(screen.getByText('Cows, Comments and Confessions')).toBeTruthy()
		expect(mockManifest).not.toHaveBeenCalled()
		expect(mockBody).not.toHaveBeenCalled()
	})

	test('says a story is unavailable when the id is not a number', async () => {
		await renderStory(Number('not-a-number'))
		expect(screen.getByText('Story unavailable')).toBeTruthy()
		expect(mockBody).not.toHaveBeenCalled()
	})

	test('shows the headline, kicker and byline', async () => {
		await renderStory(36911)
		expect(screen.getByText('Cows, Comments and Confessions')).toBeTruthy()
		expect(screen.getByText('Opinions')).toBeTruthy()
		expect(screen.getByText('By Ashlyn Wuench and Kenzie Nguyen')).toBeTruthy()
	})

	test('shows a card only for a writer with a profile', async () => {
		await renderStory(36911)
		expect(screen.getByText('Kenzie is a senior.')).toBeTruthy()
		expect(screen.queryByText('Ashlyn Wuench', {exact: true})).toBeNull()
	})

	test('sets the opening words of the first paragraph apart for small caps', async () => {
		await renderStory(36911)
		expect(screen.getByText('The petition was delivered')).toBeTruthy()
		expect(screen.getByText(' on Tuesday\\.')).toBeTruthy()
	})

	test('draws a later paragraph as Markdown', async () => {
		await renderStory(36911)
		expect(screen.getByText('Body text\\.')).toBeTruthy()
		expect(screen.queryByText('Read on olafmessenger.com')).toBeNull()
	})

	test('sends a story with no body to olafmessenger.com', async () => {
		await renderStory(36950)
		expect(screen.getByText('Spring Sketches')).toBeTruthy()

		fireEvent.press(screen.getByText('Read on olafmessenger.com'))

		expect(openUrl).toHaveBeenCalledWith('https://olafmessenger.com/36950/')
	})
	test('draws a Horoscopes post with its own template and no site link', async () => {
		await renderStory(36518)

		expect(screen.getByText('Pick your sign')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Aries, March 21 to April 19'})).toBeTruthy()
		expect(screen.queryByText('Read on olafmessenger.com')).toBeNull()
	})

	test('opens a Horoscopes post on the remembered sign', async () => {
		useMessStore.setState({lastSign: 'leo'})
		await renderStory(36518)

		expect(screen.getByText('leo reading')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Leo', selected: true})).toBeTruthy()
	})

	test('draws a comic as a framed image that opens the viewer', async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {title: '', stories: []})
		await renderStory(36819)

		fireEvent.press(
			screen.getByRole('button', {
				name: 'Mouse Friends: sunsets of life, by Ashlyn Wuench and Kenzie Nguyen',
			}),
		)

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Messenger/image',
			params: {id: '36819'},
		})
	})

	test('draws a comic once, as its body rather than as a lead photo too', async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {title: '', stories: []})
		await renderStory(36819)

		let uris = hostProps(screen.toJSON() as Node | Node[] | null, 'Image').map(
			(props) => (props.source as {uri?: string} | undefined)?.uri,
		)
		expect(uris.filter((uri) => uri === COMIC_IMAGE.url)).toHaveLength(1)
	})

	test("follows a comic's image with its remaining text and its series, and no site link", async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {
			title: 'More Mouse Friends',
			stories: [{...COMIC, id: 2, title: 'Mouse Friends episode 2: Mary! Gold!'}],
		})
		await renderStory(36819)

		expect(screen.getByText(/^The mice watch/u)).toBeTruthy()
		expect(screen.getByText('More Mouse Friends')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Mouse Friends episode 2: Mary! Gold!'})).toBeTruthy()
		expect(screen.queryByText('Read on olafmessenger.com')).toBeNull()
	})

	test('draws an article as an article even with a sign remembered', async () => {
		useMessStore.setState({lastSign: 'taurus'})
		await renderStory(36911)

		expect(screen.getByText('Body text\\.')).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'Taurus'})).toBeNull()
		expect(screen.queryByText('Pick your sign')).toBeNull()
	})
	test('sets a poem under a quieter header: the title, then its writers and date on one line', async () => {
		await renderStory(36280)

		expect(screen.getByText('A room in Oklahoma')).toBeTruthy()
		expect(screen.getByText('Variety · Poetry')).toBeTruthy()
		expect(screen.getByText('Ashlyn Wuench and Kenzie Nguyen · April 29, 2026')).toBeTruthy()
		expect(screen.queryByText(/^By /u)).toBeNull()
	})

	test("draws a poem's lines, each once, rather than its paragraphs", async () => {
		await renderStory(36280)

		expect(screen.getAllByText('My bitter yellow comes with me on walks\\.')).toHaveLength(1)
		expect(screen.getByText('It hums at the gate\\.')).toBeTruthy()
	})

	test('draws a Crossword post with a button that opens its puzzle, then its text', async () => {
		await renderStory(36814)

		fireEvent.press(screen.getByRole('button', {name: 'Solve the crossword'}))

		expect(openUrl).toHaveBeenCalledWith(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=af644d78&set=c2b247b419ae1dc89954424eb39235cd774839006bb020ce26abcf072f7ecaf4&embed=1',
		)
		expect(screen.getByText(/^Answers/u)).toBeTruthy()
		expect(screen.queryByText('Read on olafmessenger.com')).toBeNull()
	})

	test("draws a Playlist post as a button to Spotify and Spotify's player, then its text", async () => {
		await renderStory(30713)

		fireEvent.press(screen.getByRole('button', {name: 'Open in Spotify'}))

		// Handed to iOS, never the in-app sheet, which cannot pass a link on to the Spotify app.
		expect(openInIOS).toHaveBeenCalledWith(
			'https://open.spotify.com/playlist/6bscojNnnO6nZcAnnXI1Cs',
		)
		expect(openUrl).not.toHaveBeenCalled()
		expect(screen.getByTestId('mess-playlist-embed').props.source).toStrictEqual({
			uri: 'https://open.spotify.com/embed/playlist/6bscojNnnO6nZcAnnXI1Cs',
		})
		expect(screen.getByText(/^While you listen/u)).toBeTruthy()
		expect(screen.queryByText('Open on the Mess')).toBeNull()
		// Its body named the playlist, so its web page is never read.
		expect(mockBody).not.toHaveBeenCalled()
	})

	test("draws a Playlist post's picture once, in its card rather than as a lead photo too", async () => {
		await renderStory(30713)

		let uris = hostProps(screen.toJSON() as Node | Node[] | null, 'Image').map(
			(props) => (props.source as {uri?: string} | undefined)?.uri,
		)
		expect(uris.filter((uri) => uri === PLAYLIST_PHOTO.url)).toHaveLength(1)
	})

	test('reads a Playlist post with nothing in its body from its web page', async () => {
		serve((href) => (href === PAGE_PLAYLIST.link ? PLAYLIST_PAGE : []))
		await renderStory(36532)

		let embed = await screen.findByTestId('mess-playlist-embed')

		expect(embed.props.source).toStrictEqual({
			uri: 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk',
		})
		expect(screen.getByRole('button', {name: 'Open in Spotify'})).toBeTruthy()
		expect(fetchedHrefs()).toStrictEqual([PAGE_PLAYLIST.link])
	})

	test('holds one loading place for the button and player while the web page is read', async () => {
		mockBody.mockReturnValue(new Promise(() => undefined))
		await renderStory(36532)

		expect(screen.getByLabelText('Loading')).toBeTruthy()
		expect(screen.queryByRole('button', {name: 'Open in Spotify'})).toBeNull()
		expect(screen.queryByTestId('mess-playlist-embed')).toBeNull()
		expect(screen.queryByText('Open on the Mess')).toBeNull()
	})

	test('falls back to the article with a link to the page when the page names no playlist', async () => {
		serve(() => '<html><body><p>No player here.</p></body></html>')
		await renderStory(36532)

		fireEvent.press(await screen.findByRole('button', {name: 'Open on the Mess'}))

		expect(openUrl).toHaveBeenCalledWith(PAGE_PLAYLIST.link)
		expect(screen.queryByRole('button', {name: 'Open in Spotify'})).toBeNull()
		expect(screen.queryByTestId('mess-playlist-embed')).toBeNull()
		expect(screen.queryByLabelText('Loading')).toBeNull()
		expect(screen.queryByText('Read on olafmessenger.com')).toBeNull()
	})

	test('falls back the same way when the web page cannot be read', async () => {
		mockBody.mockRejectedValue(new Error('offline'))
		await renderStory(36532)

		expect(await screen.findByRole('button', {name: 'Open on the Mess'})).toBeTruthy()
		expect(screen.queryByLabelText('Loading')).toBeNull()
	})
})
