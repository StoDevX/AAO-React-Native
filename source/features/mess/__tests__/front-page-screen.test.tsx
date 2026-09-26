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
import {messIssueOptions} from '../query'
import {parseLightPosts} from '../lib/issues'
import {messKeys} from '../lib/keys'
import {parseMessCategories} from '../lib/posts'
import {OLAF_MESSENGER} from '../../news/sources'
import {useNewsFilterStore} from '../../news/store'
import type {LightPost, MessStory} from '../types'

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
	// The range groupIssues gives a day of five posts on Apr 29 with no issue after it.
	queryClient.setQueryData(
		messKeys.issue({after: '2026-04-28T23:59:59', before: null, count: 5}),
		ISSUE_STORIES,
	)
}

/** Five posts of a special edition on May 12, newer than the Apr 29 issue. */
const SPECIAL_POSTS: LightPost[] = [0, 1, 2, 3, 4].map((n) => ({
	id: 20 - n,
	day: '2026-05-12',
	title: n === 0 ? 'Letter from the editors' : `Special edition story ${n}`,
	section: 'Special Edition',
	special: true,
	featured: false,
	photo: null,
	photoUrl: null,
}))

/** A special edition newer than the Apr 29 issue, whose range now ends where the special edition begins. */
function seedTopUnderSpecial(): void {
	queryClient.setQueryData(messKeys.issues, {
		pages: [[...SPECIAL_POSTS, ...ISSUE_STORIES.map(light)]],
		pageParams: [1],
	})
	queryClient.setQueryData(
		messKeys.issue({after: '2026-04-28T23:59:59', before: '2026-05-12T00:00:00', count: 5}),
		ISSUE_STORIES,
	)
}

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
	test('opens on Top: the newest issue under the masthead, its lead, then its shelves', async () => {
		seedTop()
		await renderScreen()

		expect(screen.getByRole('button', {name: 'Top', selected: true})).toBeTruthy()
		expect(screen.getByText('April 29, 2026 · 5 stories')).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()
		expect(screen.getByRole('button', {name: 'All Opinions'})).toBeTruthy()
	})

	// The newest issue's range has no end, so only its count shows that a story joined it.
	test('fetches Top again once the issue list counts another story for it', async () => {
		seedTop()
		serve(() => [])
		await renderScreen()
		expect(postHrefs()).toStrictEqual([])

		let petition = {...light(PETITION), id: 99, title: 'A late story'}
		await act(async () => {
			queryClient.setQueryData(messKeys.issues, {
				pages: [[petition, ...ISSUE_STORIES.map(light)]],
				pageParams: [1],
			})
			await flushQueryNotifications()
		})

		expect(screen.getByText('April 29, 2026 · 6 stories')).toBeTruthy()
		expect(postHrefs()).toStrictEqual([
			expect.stringContaining('/posts?after=2026-04-28T23:59:59&per_page=100&_embed=true'),
		])
		await waitForQueriesToSettle(queryClient)
	})

	// A reader part way down Top should not lose the page to a spinner when a story joins it.
	test("keeps Top's stories on screen while it fetches them again for a new story", async () => {
		seedTop()
		let answer: (value: unknown) => void = () => undefined
		serve(() => new Promise((resolve) => (answer = resolve)))
		await renderScreen()

		let late = {...light(PETITION), id: 99, title: 'A late story'}
		await act(async () => {
			queryClient.setQueryData(messKeys.issues, {
				pages: [[late, ...ISSUE_STORIES.map(light)]],
				pageParams: [1],
			})
			await flushQueryNotifications()
		})

		expect(screen.getByText('April 29, 2026 · 6 stories')).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()
		await act(() => {
			answer(ISSUE_STORIES)
		})
		await waitForQueriesToSettle(queryClient)
	})

	test("saves Top's issue for the next launch, and no other issue", async () => {
		seedTop()
		// An older issue opened from Issues, made through its options as the app makes it.
		let older = {after: '2026-03-24T23:59:59', before: '2026-04-29T00:00:00', count: 5}
		await queryClient.query({...messIssueOptions(older), initialData: ISSUE_STORIES})
		await renderScreen()

		let saved = dehydrate(queryClient, persistOptions.dehydrateOptions).queries.map(
			(query) => query.queryKey,
		)
		expect(saved).toContainEqual(
			messKeys.issue({after: '2026-04-28T23:59:59', before: null, count: 5}),
		)
		expect(saved).not.toContainEqual(
			messKeys.issue({after: '2026-03-24T23:59:59', before: '2026-04-29T00:00:00', count: 5}),
		)
	})

	test('puts Top on the newest regular issue, under a banner for a newer special edition', async () => {
		seedTopUnderSpecial()
		await renderScreen()

		expect(screen.getByText('April 29, 2026 · 5 stories')).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()

		await fireEvent.press(
			screen.getByRole('button', {name: 'Special Edition · May 12, Letter from the editors'}),
		)

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Messenger/issue',
			params: {day: '2026-05-12'},
		})
	})

	test('shows no banner when the newest issue is regular', async () => {
		seedTop()
		await renderScreen()

		expect(screen.queryByText(/^Special Edition/u)).toBeNull()
	})

	test('falls back to the feed when the issue list holds only a special edition', async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [SPECIAL_POSTS], pageParams: [1]})
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		await renderScreen()

		expect(screen.getByText('Latest stories')).toBeTruthy()
		expect(screen.queryByText(/^Special Edition/u)).toBeNull()
	})

	test('lists a special edition on the Issues chip with its label', async () => {
		saveChoice('Issues')
		seedTopUnderSpecial()
		await renderScreen()

		expect(screen.getByText('Special Edition · May 12, 2026')).toBeTruthy()
		expect(screen.getByText('April 29, 2026')).toBeTruthy()
	})

	test('offers every chip, in order', async () => {
		seedTop()
		await renderScreen()

		for (let label of ['Top', 'Issues', 'News', 'Opinions', 'A&E', 'Sports', 'Variety']) {
			expect(screen.getByRole('button', {name: label})).toBeTruthy()
		}
	})

	test('shows the chosen chip, and remembers it', async () => {
		seedTop()
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.category(NEWS), [GRANT])
		await renderScreen()

		await fireEvent.press(screen.getByRole('button', {name: 'News'}))

		expect(screen.getByRole('button', {name: 'News', selected: true})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Good Questions'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Hunger Free Campus grant, Apr 29'})).toBeTruthy()
		expect(savedChoice()).toBe('News')
	})

	test('opens on the chip chosen last time', async () => {
		saveChoice('Issues')
		seedTop()
		await renderScreen()

		expect(screen.getByRole('button', {name: 'Issues', selected: true})).toBeTruthy()
		expect(screen.getByText('Every issue')).toBeTruthy()
		expect(screen.getByText('5 stories')).toBeTruthy()
	})

	test('opens on Top when the saved choice is a column the old filter offered', async () => {
		saveChoice('Poetry')
		seedTop()
		await renderScreen()

		expect(screen.getByRole('button', {name: 'Top', selected: true})).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()
	})

	test('"All ›" on a shelf switches to that section\'s chip', async () => {
		seedTop()
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.category(OPINIONS), [WATERS])
		await renderScreen()

		await fireEvent.press(screen.getByRole('button', {name: 'All Opinions'}))

		expect(screen.getByRole('button', {name: 'Opinions', selected: true})).toBeTruthy()
		expect(savedChoice()).toBe('Opinions')
	})

	test('lists the issues, and opens one on its own page', async () => {
		saveChoice('Issues')
		seedTop()
		await renderScreen()

		await fireEvent.press(
			screen.getByRole('button', {
				name: 'April 29, 2026, Student workers deliver petition, 5 stories',
			}),
		)

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Messenger/issue',
			params: {day: '2026-04-29'},
		})
	})

	test('falls back to the feed under "Latest stories" when the issue list fails', async () => {
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		serve(() => Promise.reject(new Error('offline')))
		await renderScreen()

		expect(await screen.findByText('Latest stories')).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()
		expect(screen.getByRole('button', {name: 'All Opinions'})).toBeTruthy()
	})

	// Offline, the issue list is paused rather than failed.
	test('falls back to the feed when offline with no issue list cached', async () => {
		queryClient.setQueryData(messKeys.feed, ISSUE_STORIES)
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('Latest stories')).toBeTruthy()
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News'}),
		).toBeTruthy()
	})

	// The list was saved from an earlier visit to Issues, but Top's own stories never were.
	test("says Top's issue loads once back online when offline with only the list cached", async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [ISSUE_STORIES.map(light)], pageParams: [1]})
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('April 29, 2026 · 5 stories')).toBeTruthy()
		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('says the feed loads once back online when offline with nothing cached', async () => {
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('Latest stories')).toBeTruthy()
		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('says Issues loads once back online when offline with nothing cached', async () => {
		saveChoice('Issues')
		onlineManager.setOnline(false)
		await renderScreen()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('shows Try Again on Issues when the issue list fails', async () => {
		saveChoice('Issues')
		serve(() => Promise.reject(new Error('offline')))
		await renderScreen()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
	})

	test('pull-to-refresh on Top fetches the issue list and the newest issue', async () => {
		seedTop()
		serve(() => [])
		await renderScreen()

		await pullToRefresh()

		expect(postHrefs()).toEqual(
			expect.arrayContaining([
				expect.stringContaining('/posts?per_page=100&page=1&_fields='),
				expect.stringContaining('/posts?after=2026-04-28T23:59:59&per_page=100&_embed=true'),
			]),
		)
		expect(postHrefs().filter((href) => href.includes('categories='))).toStrictEqual([])
		// The refreshed list is empty, so Top falls back to the feed, which fetches.
		await waitForQueriesToSettle(queryClient)
		expect(screen.getByText('Latest stories')).toBeTruthy()
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

		await pullToRefresh()

		expect(postHrefs().filter((href) => href.includes('/posts?per_page='))).toStrictEqual([
			expect.stringContaining('/posts?per_page=100&page=1&_fields='),
		])
		await waitForQueriesToSettle(queryClient)
	})

	// The end row appears the moment a refresh cuts the list to one page, and a fetch of the
	// next page would cancel the refresh.
	test('pull-to-refresh on Issues brings in the fresh first page', async () => {
		saveChoice('Issues')
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
			return springPosts.slice((page - 1) * 100, page * 100)
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

		expect(screen.getByText('A fresh headline')).toBeTruthy()
	})

	test('pull-to-refresh on a section fetches that section, and nothing else', async () => {
		saveChoice('News')
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
