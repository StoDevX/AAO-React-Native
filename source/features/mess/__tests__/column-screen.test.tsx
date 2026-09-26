import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {onlineManager, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {flushQueryNotifications} from '../../../testing/query-notifications'
import {ColumnScreen} from '../column-screen'
import {messKeys} from '../lib/keys'
import {parseMessCategories} from '../lib/posts'
import type {MessStory} from '../types'

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

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.categories, parseMessCategories(categoriesJson))
	queryClient.setQueryData(messKeys.category(GOOD_QUESTIONS), [QUESTION])
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

		expect(mockNavigate).toHaveBeenCalledWith({pathname: '/Messenger/story', params: {id: '36800'}})
	})

	test('says it loads once back online when offline with its stories not cached', async () => {
		queryClient.removeQueries({queryKey: messKeys.category(GOOD_QUESTIONS)})
		onlineManager.setOnline(false)
		await renderColumn()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('pull-to-refresh fetches the column, and nothing else', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categoriesJson : []),
		)
		await renderColumn()

		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		await act(async () => {
			await refresh()
			await flushQueryNotifications()
		})

		// The stories fetch reads the category tree through the app's own client, which is empty here.
		let postHrefs = mockBody.mock.calls
			.map((call) => call[0])
			.filter((href) => !href.includes('/categories'))
		expect(postHrefs).toStrictEqual([
			`https://olafmessenger.com/wp-json/wp/v2/posts?categories=${GOOD_QUESTIONS}&per_page=30&_embed=true`,
		])
	})
})
