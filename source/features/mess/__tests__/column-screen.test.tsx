import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {onlineManager, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import {openUrl} from '@frogpond/open-url'

import categoriesJson from './fixtures/categories.json'
import postsJson from './fixtures/posts.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {flushQueryNotifications, waitForQueriesToSettle} from '../../../testing/query-notifications'
import {ColumnScreen} from '../column-screen'
import {messKeys} from '../lib/keys'
import {onePage} from './one-page'
import {parseMessCategories} from '../lib/posts'
import {useMessStore} from '../store'
import type {MessStory} from '../types'

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
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const GOOD_QUESTIONS = 65
const QUESTION: MessStory = {
	id: 36800,
	title: 'Why is the Cage so loud?',
	excerpt: '',
	link: 'https://olafmessenger.com/36800/',
	published: '2026-04-29T22:00:00.000Z',
	section: 'News',
	column: 'Good Questions',
	featured: false,
	bylines: [],
	photo: null,
	blocks: [],
	layout: {kind: 'article'},
}

const CROSSWORD: MessStory = {
	...QUESTION,
	id: 36900,
	title: 'Crossword: Finals Week',
	column: 'Crossword',
	layout: {kind: 'crossword', puzzle: {id: 'finals', set: 'olafmessenger'}},
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.categories, parseMessCategories(categoriesJson))
	queryClient.setQueryData(messKeys.category(GOOD_QUESTIONS), onePage([QUESTION]))
})

afterEach(() => {
	onlineManager.setOnline(true)
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderColumn() {
	return render(
		<QueryClientProvider client={queryClient}>
			<ColumnScreen id={GOOD_QUESTIONS} />
		</QueryClientProvider>,
	)
}

describe('ColumnScreen', () => {
	test("lists the column's stories, and opens one in the reader", async () => {
		await renderColumn()

		await fireEvent.press(screen.getByRole('button', {name: 'Why is the Cage so loud?, Apr 29'}))

		expect(mockNavigate).toHaveBeenCalledWith({pathname: '/messenger/story', params: {id: '36800'}})
	})

	test("opens a crossword's puzzle straight from its row when the list holds only crosswords", async () => {
		useMessStore.setState({openedStories: []})
		queryClient.setQueryData(messKeys.category(GOOD_QUESTIONS), onePage([CROSSWORD]))
		await renderColumn()

		// The row points out of the app, as any row that opens a page elsewhere does.
		expect(screen.getByTestId('symbol-arrow.up.right')).toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('link', {name: 'Crossword: Finals Week, Apr 29'}))

		expect(openUrl).toHaveBeenCalledWith(
			'https://puzzleme.amuselabs.com/pmm/crossword?id=finals&set=olafmessenger&embed=1',
		)
		expect(mockNavigate).not.toHaveBeenCalled()
		// Solved from its row, it still counts as read towards its issue's stains.
		expect(useMessStore.getState().openedStories).toStrictEqual([36900])
	})

	test('opens a crossword in the reader when the list holds other stories too', async () => {
		queryClient.setQueryData(messKeys.category(GOOD_QUESTIONS), onePage([QUESTION, CROSSWORD]))
		await renderColumn()

		expect(screen.queryByTestId('symbol-arrow.up.right')).not.toBeOnTheScreen()
		await fireEvent.press(screen.getByRole('button', {name: 'Crossword: Finals Week, Apr 29'}))

		expect(mockNavigate).toHaveBeenCalledWith({pathname: '/messenger/story', params: {id: '36900'}})
		expect(openUrl).not.toHaveBeenCalled()
	})

	test('says it loads once back online when offline with its stories not cached', async () => {
		queryClient.removeQueries({queryKey: messKeys.category(GOOD_QUESTIONS)})
		onlineManager.setOnline(false)
		await renderColumn()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	// An infinite query refetches every page it holds, one after another.
	test("pull-to-refresh fetches the column's first page, and nothing else", async () => {
		queryClient.setQueryData(messKeys.category(GOOD_QUESTIONS), {
			pages: [[QUESTION], []],
			pageParams: [1, 2],
		})
		// A full first page, as a busy column's is, so a refetch of every page would go on past it.
		let fullPage = Array.from({length: 30}, (_, index) => ({...postsJson[0], id: index + 1}))
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			Promise.resolve(
				href.includes('/categories') ? categoriesJson : href.includes('&page=') ? [] : fullPage,
			),
		)
		await renderColumn()

		// The stories fetch reads the category tree through the app's own client, which is empty here.
		let postHrefs = () =>
			mockBody.mock.calls.map((call) => call[0]).filter((href) => !href.includes('/categories'))
		// What the refresh itself fetched; afterwards the list's end row goes on to page 2.
		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		let fetchedByRefresh: string[] = []
		await act(async () => {
			await refresh()
			fetchedByRefresh = postHrefs()
			await flushQueryNotifications()
		})

		expect(fetchedByRefresh).toStrictEqual([
			`https://olafmessenger.com/wp-json/wp/v2/posts?categories=${GOOD_QUESTIONS}&per_page=30&_embed=true`,
		])
		await waitForQueriesToSettle(queryClient)
	})
})
