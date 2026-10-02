import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import springPosts from './fixtures/issue-posts.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {flushQueryNotifications, waitForQueriesToSettle} from '../../../testing/query-notifications'
import {ISSUE_TILE_ID, IssueGrid, TOP_TILE_ID} from '../issue-grid'
import {groupIssues} from '../lib/issues'
import {messKeys} from '../lib/keys'
import {useMessStore} from '../store'
import type {LightPost, MessIssue, MessStory} from '../types'
import {useMessIssues} from '../use-mess-issues'
import {tileEvents} from './mess-issue-tile-mock'

jest.mock('@frogpond/mess-issue-tile', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./mess-issue-tile-mock') as typeof import('./mess-issue-tile-mock')
})
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

/** The spring's three pages of light posts, as WordPress serves them. */
const PAGES = [springPosts.slice(0, 100), springPosts.slice(100, 200), springPosts.slice(200)]

/** Five posts on one day, so the day makes an issue; the first is the newest, with `first` set on it. */
function issueDay(day: string, newestId: number, first: Partial<LightPost> = {}): LightPost[] {
	return [0, 1, 2, 3, 4].map((offset) => ({
		id: newestId - offset,
		day,
		title: `Story ${newestId - offset}`,
		section: 'News',
		special: false,
		featured: offset === 0,
		photo: null,
		photoUrl: null,
		...(offset === 0 ? first : {}),
	}))
}

const POSTS = [
	...issueDay('2026-05-12', 25, {title: 'Letter from the editors'}),
	...issueDay('2026-04-29', 20, {
		title: 'Hunger Free Campus grant',
		photo: 1,
		photoUrl: 'https://olafmessenger.com/grant.jpg',
	}),
	...issueDay('2026-03-25', 15),
	...issueDay('2025-12-03', 10),
]
const ISSUES = groupIssues(POSTS, false)

/** The newest issue's lead story, as the issue's own query gives it. */
const LEAD: MessStory = {
	id: 25,
	title: 'Letter from the editors',
	excerpt: '',
	link: 'https://olafmessenger.com/25/',
	published: '2026-05-12T15:00:00.000Z',
	section: 'News',
	column: null,
	featured: true,
	bylines: [],
	photo: null,
	blocks: [
		{type: 'paragraph', runs: [{text: 'We write to you.'}]},
		{type: 'paragraph', runs: [{text: 'Thank you for reading.'}]},
	],
	layout: {kind: 'article'},
}

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		Promise.resolve(href.includes('/categories') ? categoriesJson : answer(href)),
	)
}

/** The spring's pages by their number, and no photos for any lead. */
function springPage(href: string): unknown {
	if (href.includes('/media')) return []
	if (!href.includes('_fields=id,date')) return []
	let page = Number(/[?&]page=(\d+)/u.exec(href)?.[1])
	return PAGES[page - 1]
}

/** The post hrefs fetched, leaving out the category tree. */
const postHrefs = () =>
	mockBody.mock.calls.map((call) => call[0]).filter((href) => !href.includes('/categories'))

/** How many tiles are drawn, the top tile's included. */
const tilesDrawn = () =>
	screen.queryAllByTestId(ISSUE_TILE_ID).length + screen.queryAllByTestId(TOP_TILE_ID).length

let queryClient: QueryClient
let onOpen: jest.Mock<(issue: MessIssue) => void>

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	onOpen = jest.fn()
	useMessStore.setState({openedStories: [], stainKind: 'coffee'})
	tileEvents.renders.length = 0
	tileEvents.mounts.length = 0
	// A tile with no photo asks for its lead story's words; unless a test says otherwise, it has none.
	serve(() => ({content: {rendered: ''}}))
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

/** The grid as By Issue draws it, once the list's first page has loaded. */
function Grid({landscape}: {landscape: boolean}): React.ReactNode {
	let {issues, query} = useMessIssues()
	return issues ? (
		<IssueGrid issues={issues} landscape={landscape} onOpen={onOpen} query={query} />
	) : null
}

/**
 * The grid over the four issues, with the newest issue's stories cached as `stories` says, once
 * the photo-less tiles have their words. With no stories cached the fetches are left in flight.
 */
async function renderGrid({
	landscape = false,
	stories = [LEAD],
}: {landscape?: boolean; stories?: MessStory[] | null} = {}): Promise<void> {
	queryClient.setQueryData(messKeys.issues, {pages: [POSTS], pageParams: [1]})
	let top = ISSUES[0] as MessIssue
	if (stories) queryClient.setQueryData(messKeys.issue(top), stories)
	await render(
		<QueryClientProvider client={queryClient}>
			<Grid landscape={landscape} />
		</QueryClientProvider>,
	)
	if (stories) await waitForQueriesToSettle(queryClient)
}

describe('IssueGrid', () => {
	test('keeps the tiles that stay in their row when a newer issue arrives', async () => {
		await renderGrid()
		tileEvents.mounts.length = 0

		// A newer issue takes the top; the old top joins the grid, pushing each tile along a slot.
		await act(async () => {
			queryClient.setQueryData(messKeys.issues, {
				pages: [[...issueDay('2026-05-20', 30), ...POSTS]],
				pageParams: [1],
			})
			await flushQueryNotifications()
		})

		// Apr 29 moves from the first slot of 2026's first row to the second, and stays; Mar 25 moves
		// down to a row of its own, so it is built again.
		expect(tileEvents.mounts).not.toContainEqual(expect.stringMatching(/^April 29, 2026/u))
		expect(tileEvents.mounts).toContainEqual(expect.stringMatching(/^March 25, 2026/u))
		// The old top, photo-less, now asks for its lead's words, and the new top for its stories.
		await waitForQueriesToSettle(queryClient)
	})

	test('draws again only the tile of the issue a story was opened from', async () => {
		await renderGrid()
		tileEvents.renders.length = 0

		await act(() => {
			useMessStore.setState({openedStories: [15]})
		})

		expect(tileEvents.renders).toStrictEqual([expect.stringMatching(/^March 25, 2026/u)])
	})

	test('leads with the newest issue as the top tile, carrying its lead story in columns', async () => {
		await renderGrid()

		let top = screen.getByTestId(TOP_TILE_ID)
		expect(top.props.accessibilityLabel).toBe('May 12, 2026, Letter from the editors')
		expect(top.props.accessibilityValue.text).toBe('topPortrait, 0 coffee, 2 paragraphs')
		expect(screen.getAllByTestId(ISSUE_TILE_ID)).toHaveLength(3)
	})

	test('lays the top tile out wide in landscape', async () => {
		await renderGrid({landscape: true})

		expect(screen.getByTestId(TOP_TILE_ID).props.accessibilityValue.text).toBe(
			'topLandscape, 0 coffee, 2 paragraphs',
		)
	})

	test('gives the top tile blank paper until its lead story loads', async () => {
		serve(() => new Promise(() => undefined))
		await renderGrid({stories: null})

		expect(screen.getByTestId(TOP_TILE_ID).props.accessibilityValue.text).toBe(
			'topPortrait, 0 coffee, 0 paragraphs',
		)
		expect(screen.getAllByTestId(ISSUE_TILE_ID)).toHaveLength(3)
	})

	test('heads each year with how many of its issues are loaded, the top tile counted', async () => {
		await renderGrid()

		expect(screen.getByText('2026')).toBeTruthy()
		expect(screen.getByText('3 issues')).toBeTruthy()
		expect(screen.getByText('2025')).toBeTruthy()
		expect(screen.getByText('1 issue')).toBeTruthy()
	})

	test('stains an issue by how much of it the reader has opened, in the kind they chose', async () => {
		useMessStore.setState({openedStories: [20, 19, 18, 17], stainKind: 'tea'})
		await renderGrid()

		let tile = screen.getByRole('button', {
			name: 'April 29, 2026, Hunger Free Campus grant, 4 of 5 stories read',
		})
		expect(tile.props.accessibilityValue.text).toBe('grid, 3 tea, 0 paragraphs')
	})

	test("sets a tile with no photo with its lead story's words, below its fold", async () => {
		serve((href) =>
			href.includes('/posts/15?_fields=content')
				? {content: {rendered: '<p>One.</p><p>Two.</p><p>Three.</p>'}}
				: {content: {rendered: ''}},
		)
		await renderGrid()

		let march = screen.getByRole('button', {name: /^March 25, 2026/u})
		expect(march.props.accessibilityValue.text).toBe('grid, 0 coffee, 3 paragraphs')
	})

	test('asks for no words for a tile with a photo', async () => {
		await renderGrid()

		expect(postHrefs().filter((href) => href.includes('_fields=content'))).toStrictEqual([
			expect.stringContaining('/posts/15?_fields=content'),
			expect.stringContaining('/posts/10?_fields=content'),
		])
	})

	// The photos' addresses are looked up page by page, and a failed lookup leaves every lead's
	// address blank; a lead that has a photo is still no photo-less lead.
	test("asks for no words for a lead with a photo whose address wasn't found", async () => {
		let unfound = POSTS.map((post) => (post.id === 20 ? {...post, photoUrl: null} : post))
		queryClient.setQueryData(messKeys.issues, {pages: [unfound], pageParams: [1]})
		await render(
			<QueryClientProvider client={queryClient}>
				<Grid landscape={false} />
			</QueryClientProvider>,
		)
		await waitForQueriesToSettle(queryClient)

		expect(postHrefs().filter((href) => href.includes('/posts/20?_fields=content'))).toStrictEqual(
			[],
		)
	})

	test('opens the issue a tile shows', async () => {
		await renderGrid()

		fireEvent.press(screen.getByRole('button', {name: 'April 29, 2026, Hunger Free Campus grant'}))

		expect(onOpen.mock.lastCall?.[0]).toMatchObject({day: '2026-04-29'})
	})

	// Page 2 completes Mar 18 but leaves the grid's end on screen, so the end has to fetch again.
	test('fetches the next page each time the end comes into view, until the last', async () => {
		serve(springPage)
		await render(
			<QueryClientProvider client={queryClient}>
				<Grid landscape={false} />
			</QueryClientProvider>,
		)

		await waitFor(() => expect(tilesDrawn()).toBe(8))

		await waitForQueriesToSettle(queryClient)
	})

	test('keeps the loaded issues when a further page fails, and offers Try Again at the end', async () => {
		serve((href) =>
			href.includes('page=1&') || !href.includes('_fields=id,date')
				? springPage(href)
				: Promise.reject(new Error('offline')),
		)
		await render(
			<QueryClientProvider client={queryClient}>
				<Grid landscape={false} />
			</QueryClientProvider>,
		)

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(tilesDrawn()).toBe(3)

		serve(springPage)
		await fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))

		await waitFor(() => expect(tilesDrawn()).toBe(8))

		await waitForQueriesToSettle(queryClient)
	})
})
