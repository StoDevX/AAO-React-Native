import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {dehydrate, onlineManager, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import springPosts from './fixtures/issue-posts.json'
import {queryClient as appQueryClient, persistOptions} from '../../../init/tanstack-query'
import {flushQueryNotifications, waitForQueriesToSettle} from '../../../testing/query-notifications'
import {FrontPageScreen} from '../front-page-screen'
import {TOP_TILE_ID} from '../issue-grid'
import {messIssueOptions} from '../query'
import {parseLightPosts} from '../lib/issues'
import {messKeys} from '../lib/keys'
import {parseMessCategories} from '../lib/posts'
import {DATELINE_ID} from '../masthead'
import {OLAF_MESSENGER} from '../../news/sources'
import {useNewsFilterStore} from '../../news/store'
import type {LightPost, MessStory} from '../types'

jest.mock('@frogpond/mess-issue-tile', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./mess-issue-tile-mock') as typeof import('./mess-issue-tile-mock')
})
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const categories = parseMessCategories(categoriesJson)
const NEWS = 7
const OPINIONS = 8
const PHOTO = {url: 'https://olafmessenger.com/photo.jpg', width: 1200, height: 800, caption: ''}

function story(
	id: number,
	title: string,
	section: string,
	extra: Partial<MessStory> = {},
): MessStory {
	return {
		id,
		title,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: '2026-04-29T22:00:00.000Z',
		section,
		column: null,
		featured: false,
		bylines: [],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
		...extra,
	}
}

const PETITION = story(5, 'Student workers deliver petition', 'News', {
	featured: true,
	photo: PHOTO,
})
const GRANT = story(4, 'Hunger Free Campus grant', 'News', {photo: PHOTO})
const WATERS = story(3, 'I grew up in the Boundary Waters', 'Opinions', {photo: PHOTO})
const WARS = story(2, 'Cats or dogs?', 'Opinions', {column: 'Messenger Wars'})
const BAKE = story(1, 'Bake sale', 'Variety')
/** One day's five stories, which make the newest issue. */
const ISSUE_STORIES = [PETITION, GRANT, WATERS, WARS, BAKE]

/** A story as the issue list's light fields give it. */
const light = (s: MessStory): LightPost => ({
	id: s.id,
	day: '2026-04-29',
	title: s.title,
	section: s.section,
	special: false,
	featured: s.featured,
	photo: null,
	photoUrl: null,
})

let queryClient: QueryClient

/** The issue list, and the stories of its one issue, as a warm cache holds them. */
function seedTop(): void {
	queryClient.setQueryData(messKeys.issues, {pages: [ISSUE_STORIES.map(light)], pageParams: [1]})
	// The week groupIssues makes of five posts on Apr 29.
	queryClient.setQueryData(
		messKeys.issue({key: 'week:2026-04-27', storyIds: [5, 4, 3, 2, 1]}),
		ISSUE_STORIES,
	)
}

/** What the masthead's dateline says the page holds. */
const dateline = () => screen.getByTestId(DATELINE_ID)

/** An item of the view menu in the header, by its label. */
const menuItem = (name: string) => screen.getByRole('menuitem', {name})

/** Whether the view menu's item shows its checkmark. */
const isChecked = (name: string) => Boolean(menuItem(name).props.accessibilityState?.checked)

function saveChoice(key: string): void {
	useNewsFilterStore.setState({selectedCategories: {[OLAF_MESSENGER.id]: key}})
}

const savedChoice = () => useNewsFilterStore.getState().selectedCategories[OLAF_MESSENGER.id]

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		Promise.resolve(href.includes('/categories') ? categoriesJson : answer(href)),
	)
}

/** The post hrefs fetched, leaving out the category tree. */
const postHrefs = () =>
	mockBody.mock.calls.map((call) => call[0]).filter((href) => !href.includes('/categories'))

async function pullToRefresh(): Promise<void> {
	let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
	await act(async () => {
		await refresh()
		await flushQueryNotifications()
	})
}

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	useNewsFilterStore.setState({selectedCategories: {}})
})

afterEach(() => {
	// Back online only once the screen has unmounted, so the paused fetch has no one to update.
	onlineManager.setOnline(true)
	queryClient.clear()
	// The queries fetch their categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderScreen() {
	return render(
		<QueryClientProvider client={queryClient}>
			<FrontPageScreen />
		</QueryClientProvider>,
	)
}

describe('FrontPageScreen', () => {
	test("opens on By Issue, under the paper's nameplate and no dateline, with the newest issue as the top tile", async () => {
		seedTop()
		await renderScreen()

		expect(isChecked('By Issue')).toBe(true)
		expect(isChecked('Latest')).toBe(false)
		expect(screen.getByText('The Olaf Messenger')).toBeTruthy()
		expect(screen.queryByTestId(DATELINE_ID)).toBeNull()
		expect(screen.getByTestId(TOP_TILE_ID).props.accessibilityLabel).toBe(
			'April 29, 2026, Student workers deliver petition',
		)
	})

	test.each(['Top', 'Issues', 'News', 'Messenger Wars'])(
		'opens on By Issue when the saved choice is %p, which names no view',
		async (saved) => {
			seedTop()
			saveChoice(saved)
			await renderScreen()

			expect(isChecked('By Issue')).toBe(true)
			expect(screen.getByTestId(TOP_TILE_ID)).toBeTruthy()
		},
	)

	test('names the menu by the view it shows, for VoiceOver', async () => {
		seedTop()
		await renderScreen()
		expect(screen.getByLabelText('View: By Issue')).toBeTruthy()

		await fireEvent.press(menuItem('Latest'))
		expect(screen.getByLabelText('View: Latest')).toBeTruthy()
	})

	test('offers the sections in Latest only, and remembers the view', async () => {
		seedTop()
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		await renderScreen()
		expect(screen.queryByRole('menuitem', {name: 'Opinions'})).toBeNull()

		await fireEvent.press(menuItem('Latest'))

		expect(savedChoice()).toBe('Latest')
		expect(isChecked('Latest')).toBe(true)
		expect(isChecked('All Stories')).toBe(true)
		expect(isChecked('Opinions')).toBe(false)
		expect(dateline()).toHaveTextContent('Latest stories')
	})

	// The nameplate is the front page's heading; the dateline under it is not a second one.
	test("reads the paper's name as the heading, and not Latest's dateline", async () => {
		seedTop()
		saveChoice('Latest')
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		await renderScreen()

		expect(dateline()).toHaveTextContent('Latest stories')
		expect(screen.getByRole('header', {name: 'The Olaf Messenger'})).toBeTruthy()
		expect(screen.queryByRole('header', {name: /Latest stories/u})).toBeNull()
	})

	test('narrows Latest to the section picked, and keeps it across a visit to By Issue', async () => {
		seedTop()
		saveChoice('Latest')
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.category(OPINIONS), [WATERS])
		await renderScreen()

		await fireEvent.press(menuItem('Opinions'))

		expect(savedChoice()).toBe('Latest:Opinions')
		expect(isChecked('Opinions')).toBe(true)
		expect(isChecked('All Stories')).toBe(false)
		expect(dateline()).toHaveTextContent('Opinions')
		expect(screen.getByRole('button', {name: /^I grew up in the Boundary Waters,/u})).toBeTruthy()

		await fireEvent.press(menuItem('By Issue'))
		expect(savedChoice()).toBe('Issues:Opinions')

		await fireEvent.press(menuItem('Latest'))
		expect(savedChoice()).toBe('Latest:Opinions')

		await fireEvent.press(menuItem('All Stories'))
		expect(savedChoice()).toBe('Latest')
	})

	test('opens an issue on its own page from its tile', async () => {
		seedTop()
		await renderScreen()

		await fireEvent.press(screen.getByTestId(TOP_TILE_ID))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/messenger/issue',
			params: {key: 'week:2026-04-27'},
		})
	})

	// The newest issue's range has no end, so only its count shows that a story joined it.
	test("fetches the top tile's issue again once the issue list counts another story for it", async () => {
		seedTop()
		serve(() => [])
		await renderScreen()
		expect(postHrefs()).toStrictEqual([])

		let late = {...light(PETITION), id: 99, title: 'A late story'}
		await act(async () => {
			queryClient.setQueryData(messKeys.issues, {
				pages: [[late, ...ISSUE_STORIES.map(light)]],
				pageParams: [1],
			})
			await flushQueryNotifications()
		})

		expect(postHrefs()).toStrictEqual([
			expect.stringContaining('/posts?include=99,5,4,3,2,1&per_page=100&_embed=true'),
		])
		await waitForQueriesToSettle(queryClient)
	})

	test("saves the top tile's issue for the next launch, and no other issue", async () => {
		seedTop()
		// An older issue opened from its tile, made through its options as the app makes it.
		let older = {key: 'week:2026-03-23', storyIds: [5, 4, 3, 2, 1]}
		await queryClient.query({...messIssueOptions(older), initialData: ISSUE_STORIES})
		await renderScreen()

		let saved = dehydrate(queryClient, persistOptions.dehydrateOptions).queries.map(
			(query) => query.queryKey,
		)
		expect(saved).toContainEqual(
			messKeys.issue({key: 'week:2026-04-27', storyIds: [5, 4, 3, 2, 1]}),
		)
		expect(saved).not.toContainEqual(messKeys.issue(older))
	})

	test('says the issues load once back online when offline with nothing cached', async () => {
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('says Latest loads once back online when offline with nothing cached', async () => {
		saveChoice('Latest')
		onlineManager.setOnline(false)
		await renderScreen()

		expect(dateline()).toHaveTextContent('Latest stories')
		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('offline with no issues cached, shows the saved latest stories under the notice', async () => {
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
		expect(screen.getByRole('button', {name: /^Student workers deliver petition,/u})).toBeTruthy()
	})

	test('when the issue list fails, offers Try Again over the saved latest stories', async () => {
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		serve(() => Promise.reject(new Error('offline')))
		await renderScreen()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(screen.getByRole('button', {name: /^Student workers deliver petition,/u})).toBeTruthy()
	})

	test('shows Try Again when the issue list fails', async () => {
		serve(() => Promise.reject(new Error('offline')))
		await renderScreen()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
	})

	test('says so when the paper has no issues', async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [[]], pageParams: [1]})
		await renderScreen()

		expect(screen.getByText('The Mess has no issues yet.')).toBeTruthy()
	})

	test('pull-to-refresh fetches the issue list and the newest issue', async () => {
		seedTop()
		serve(() => [])
		await renderScreen()

		await pullToRefresh()

		expect(postHrefs()).toEqual(
			expect.arrayContaining([
				expect.stringContaining('/posts?per_page=100&page=1&_fields='),
				expect.stringContaining('/posts?include=5,4,3,2,1&per_page=100&_embed=true'),
			]),
		)
		expect(postHrefs().filter((href) => href.includes('categories='))).toStrictEqual([])
		await waitForQueriesToSettle(queryClient)
	})

	// An infinite query refetches every page it holds, one after another.
	test('pull-to-refresh fetches only the first page of the issue list, however many are loaded', async () => {
		seedTop()
		let [first] = queryClient.getQueryData<{pages: LightPost[][]}>(messKeys.issues)?.pages ?? []
		queryClient.setQueryData(messKeys.issues, {pages: [first, [], []], pageParams: [1, 2, 3]})
		// Full pages, as the live list's are, so a refetch of every page would go on past the first.
		serve((href) => {
			let page = Number(/[?&]page=(\d+)&_fields/u.exec(href)?.[1])
			return page ? springPosts.slice((page - 1) * 100, page * 100) : []
		})
		await renderScreen()

		// What the refresh itself fetched; afterwards the grid's end row, always on screen here,
		// goes on to page 2 and 3 as it would once a reader scrolled down.
		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		let fetchedByRefresh: string[] = []
		await act(async () => {
			await refresh()
			fetchedByRefresh = postHrefs().filter((href) => href.includes('/posts?per_page='))
			await flushQueryNotifications()
		})

		expect(fetchedByRefresh).toStrictEqual([
			expect.stringContaining('/posts?per_page=100&page=1&_fields='),
		])
		await waitForQueriesToSettle(queryClient)
	})

	// The end row appears the moment a refresh cuts the list to one page, and a fetch of the
	// next page would cancel the refresh.
	test('pull-to-refresh brings in the fresh first page', async () => {
		let pages = [0, 1, 2].map((n) =>
			parseLightPosts(springPosts.slice(n * 100, n * 100 + 100), categories),
		)
		queryClient.setQueryData(messKeys.issues, {pages, pageParams: [1, 2, 3]})
		let fresh = [
			{...springPosts[0], title: {rendered: 'A fresh headline'}},
			...springPosts.slice(1, 100),
		]
		// The first page answers only once the end row has had its chance to appear.
		let answerFirst: () => void = () => undefined
		serve((href) => {
			if (href.includes('/media')) return []
			let page = Number(/[?&]page=(\d+)&_fields/u.exec(href)?.[1])
			if (page === 1) return new Promise((resolve) => (answerFirst = () => resolve(fresh)))
			return page ? springPosts.slice((page - 1) * 100, page * 100) : []
		})
		await renderScreen()

		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		// Started inside act, since it cuts the list at once, but not awaited: page 1 is held open.
		let refreshed: Promise<void> = Promise.resolve()
		await act(async () => {
			refreshed = refresh()
			await flushQueryNotifications()
		})
		await act(async () => {
			answerFirst()
			await refreshed
			await flushQueryNotifications()
		})
		await waitForQueriesToSettle(queryClient)

		let [firstPage] = queryClient.getQueryData<{pages: LightPost[][]}>(messKeys.issues)?.pages ?? []
		expect(firstPage?.[0]?.title).toBe('A fresh headline')
	})

	test('pull-to-refresh on a narrowed Latest fetches that section, and nothing else', async () => {
		saveChoice('Latest:News')
		seedTop()
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.category(NEWS), [GRANT])
		serve(() => [])
		await renderScreen()

		await pullToRefresh()

		expect(postHrefs()).toStrictEqual([
			`https://olafmessenger.com/wp-json/wp/v2/posts?categories=${NEWS}&per_page=30&_embed=true`,
		])
	})
})
