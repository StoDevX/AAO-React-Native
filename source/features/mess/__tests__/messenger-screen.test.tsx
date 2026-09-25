import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import {MessengerScreen} from '../messenger-screen'
import {messKeys} from '../query'
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
jest.mock('../../news/news-picker', () => ({NewsPicker: jest.fn(() => null)}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

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
})

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	useNewsFilterStore.setState({selectedCategories: {}})
	mockNavigate.mockClear()
})

afterEach(() => {
	queryClient.clear()
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

	test('offers sections as the picker categories', async () => {
		queryClient.setQueryData(messKeys.feed, [
			story(1, 'A', 'Sports'),
			story(2, 'B', 'News'),
			story(3, 'C', 'News'),
		])
		await renderScreen()

		// oxlint-disable-next-line typescript/no-require-imports
		let {NewsPicker} = require('../../news/news-picker') as {NewsPicker: jest.Mock}
		expect(NewsPicker.mock.lastCall?.[0]).toMatchObject({categories: ['News', 'Sports']})
	})

	test('shows the error notice with Try Again when the feed fails', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await renderScreen()

		expect(await screen.findByText('Try Again')).toBeTruthy()
	})
})
