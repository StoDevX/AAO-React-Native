import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {parseMessCategories} from '../lib/posts'
import {MessengerScreen} from '../messenger-screen'
import {MessPicker} from '../mess-picker'
import {messKeys} from '../query'
import {OLAF_MESSENGER} from '../../news/sources'
import {useNewsFilterStore} from '../../news/store'
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

// The feed's fetches, so a failing feed never reaches a network Jest does not have.
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

// The picker is a native toolbar menu; what it is handed is read off the call.
jest.mock('../mess-picker', () => ({MessPicker: jest.fn(() => null)}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>
const mockPicker = MessPicker as jest.Mock<typeof MessPicker>

const categories = parseMessCategories(categoriesJson)
const POETRY = 69

/** The props the picker was last rendered with. */
function pickerProps(): Parameters<typeof MessPicker>[0] {
	let props = mockPicker.mock.lastCall?.[0]
	if (!props) throw new Error('the picker never rendered')
	return props
}

/** Chooses a section or column in the picker, as tapping it would. */
async function choose(name: string | null): Promise<void> {
	await act(() => pickerProps().onSelect(name))
}

/** Saves a filter choice, as an earlier visit would have. */
function saveChoice(name: string): void {
	useNewsFilterStore.setState({selectedCategories: {[OLAF_MESSENGER.id]: name}})
}

const story = (id: number, title: string, section: string): MessStory => ({
	id,
	title,
	excerpt: `${title} excerpt`,
	link: `https://olafmessenger.com/${id}/`,
	published: '2026-04-29T22:24:19.000Z',
	section,
	column: null,
	featured: false,
	bylines: [],
	photo: null,
	blocks: [],
	layout: {kind: 'article'},
})

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	useNewsFilterStore.setState({selectedCategories: {}})
	mockNavigate.mockClear()
})

afterEach(() => {
	queryClient.clear()
	// The feed fetches its categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderScreen() {
	return render(
		<QueryClientProvider client={queryClient}>
			<MessengerScreen />
		</QueryClientProvider>,
	)
}

describe('MessengerScreen', () => {
	test('opens a story in the reader, not the browser', async () => {
		queryClient.setQueryData(messKeys.feed, [story(36859, 'Petition', 'News')])
		await renderScreen()

		fireEvent.press(screen.getByText('Petition'))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Messenger/story',
			params: {id: '36859'},
		})
	})

	test('hands the picker the paper’s sections and columns', async () => {
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.feed, [story(1, 'A', 'Sports')])
		await renderScreen()

		let {tree, selected} = pickerProps()
		expect(tree.map((branch) => branch.section.name)).toStrictEqual([
			'News',
			'Opinions',
			'Arts & Entertainment',
			'Sports',
			'Variety',
			'Special Edition',
		])
		expect(selected).toBeNull()
	})

	test('choosing a column lists that column’s stories rather than the feed', async () => {
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		queryClient.setQueryData(messKeys.category(POETRY), [story(2, 'Ode to the Cage', 'Variety')])
		await renderScreen()

		await choose('Poetry')

		expect(await screen.findByText('Ode to the Cage')).toBeTruthy()
		expect(screen.queryByText('Front page')).toBeNull()
		expect(pickerProps().selected).toBe('Poetry')
	})

	test('All Stories lists the feed again', async () => {
		saveChoice('Poetry')
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		queryClient.setQueryData(messKeys.category(POETRY), [story(2, 'Ode to the Cage', 'Variety')])
		await renderScreen()
		expect(screen.getByText('Ode to the Cage')).toBeTruthy()

		await choose(null)

		expect(await screen.findByText('Front page')).toBeTruthy()
		expect(screen.queryByText('Ode to the Cage')).toBeNull()
	})

	test('pull-to-refresh on a column fetches the column, not the feed', async () => {
		saveChoice('Poetry')
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		queryClient.setQueryData(messKeys.category(POETRY), [story(2, 'Ode to the Cage', 'Variety')])
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categoriesJson : []),
		)
		await renderScreen()

		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		await act(async () => {
			await refresh()
			// React Query tells the screen on the turn after the fetch settles.
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		let postHrefs = mockBody.mock.calls
			.map((call) => call[0])
			.filter((h) => !h.includes('/categories'))
		expect(postHrefs).toHaveLength(1)
		expect(postHrefs[0]).toContain(`/wp-json/wp/v2/posts?categories=${POETRY}&per_page=30`)
	})

	test('a saved name the paper no longer has shows the feed', async () => {
		saveChoice('Classifieds')
		queryClient.setQueryData(messKeys.categories, categories)
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		await renderScreen()

		expect(screen.getByText('Front page')).toBeTruthy()
		expect(pickerProps().selected).toBeNull()
	})

	test('waits for the categories before listing a saved column, rather than the feed', async () => {
		saveChoice('Poetry')
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		mockManifest.mockReturnValue(new Promise(() => undefined))
		await renderScreen()

		expect(screen.getByText('Loading…')).toBeTruthy()
		expect(screen.queryByText('Front page')).toBeNull()
		expect(pickerProps().selected).toBe('Poetry')
	})

	test('offers Try Again when the categories fail with a column saved, then lists the column', async () => {
		saveChoice('Poetry')
		queryClient.setQueryData(messKeys.feed, [story(1, 'Front page', 'News')])
		queryClient.setQueryData(messKeys.category(POETRY), [story(2, 'Ode to the Cage', 'Variety')])
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await renderScreen()

		expect(await screen.findByText('Try Again')).toBeTruthy()
		expect(screen.queryByText('Front page')).toBeNull()

		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categoriesJson : []),
		)
		await act(async () => {
			fireEvent.press(screen.getByText('Try Again'))
			await queryClient.getQueryCache().find({queryKey: messKeys.categories})?.promise
			// React Query tells the screen on the turn after the fetch settles.
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		expect(screen.getByText('Ode to the Cage')).toBeTruthy()
		expect(screen.queryByText('Front page')).toBeNull()
	})

	test('shows the error notice with Try Again when the feed fails', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await renderScreen()

		expect(await screen.findByText('Try Again')).toBeTruthy()
	})
})
