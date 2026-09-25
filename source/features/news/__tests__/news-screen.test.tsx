import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {NewsList} from '../news-list'
import {NewsPicker} from '../news-picker'
import {NewsScreen} from '../news-screen'
import {keys} from '../query'
import {OLAF_MESSENGER, STOLAF_NEWS} from '../sources'
import {useNewsFilterStore} from '../store'
import type {StoryType} from '../types'

// The list and the picker render `@expo/ui`, which cannot mount under Jest.
// What the screen hands them is read off the call.
jest.mock('../news-list', () => ({NewsList: jest.fn(() => null)}))
jest.mock('../news-picker', () => ({NewsPicker: jest.fn(() => null)}))

jest.mock('expo-router', () => ({Stack: {Screen: () => null}}))

// The feed query imports the app's query client, which subscribes to NetInfo.
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

const mockNewsList = NewsList as unknown as jest.Mock<
	(props: {entries: StoryType[]; selectedCategory: string | null}) => null
>
const mockNewsPicker = NewsPicker as unknown as jest.Mock<
	(props: {categories: string[]; selectedCategory: string | null}) => null
>

let story = (title: string, categories: string[]): StoryType => ({
	authors: [],
	categories,
	content: '',
	excerpt: 'excerpt',
	title,
})

let queryClient: QueryClient

beforeEach(() => {
	// Seeded fresh, so no query refetches through a network Jest does not have.
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(keys.named('mess'), [story('Messenger story', ['Sports'])])
	queryClient.setQueryData(keys.named('stolaf'), [story('College story', ['Academics'])])
	useNewsFilterStore.setState({selectedCategories: {}})
	mockNewsList.mockClear()
	mockNewsPicker.mockClear()
})

afterEach(() => {
	queryClient.clear()
})

function renderScreen(source: typeof OLAF_MESSENGER) {
	return render(
		<QueryClientProvider client={queryClient}>
			<NewsScreen source={source} />
		</QueryClientProvider>,
	)
}

/** How many mounted components are reading a source's feed. */
function readersOf(source: string): number {
	return (
		queryClient
			.getQueryCache()
			.find({queryKey: keys.named(source)})
			?.getObserversCount() ?? 0
	)
}

describe('NewsScreen', () => {
	test('reads only its own feed', async () => {
		await renderScreen(OLAF_MESSENGER)
		expect(readersOf('mess')).toBe(1)
		expect(readersOf('stolaf')).toBe(0)
	})

	test('lists its own stories', async () => {
		await renderScreen(STOLAF_NEWS)
		let entries = mockNewsList.mock.lastCall?.[0].entries
		expect(entries?.map((s) => s.title)).toStrictEqual(['College story'])
	})

	test('offers only its own categories', async () => {
		await renderScreen(OLAF_MESSENGER)
		expect(mockNewsPicker.mock.lastCall?.[0].categories).toStrictEqual(['Sports'])
	})

	test('applies the category saved for its own source', async () => {
		useNewsFilterStore.setState({selectedCategories: {mess: 'Sports', stolaf: 'Academics'}})
		await renderScreen(OLAF_MESSENGER)
		expect(mockNewsList.mock.lastCall?.[0].selectedCategory).toBe('Sports')
		expect(mockNewsPicker.mock.lastCall?.[0].selectedCategory).toBe('Sports')
	})

	test('ignores a saved category its feed no longer carries', async () => {
		useNewsFilterStore.setState({selectedCategories: {mess: 'Opinion'}})
		await renderScreen(OLAF_MESSENGER)
		expect(mockNewsList.mock.lastCall?.[0].selectedCategory).toBeNull()
	})
})
