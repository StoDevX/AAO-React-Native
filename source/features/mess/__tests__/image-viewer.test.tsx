import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {ImageViewer} from '../image-viewer'
import {messKeys} from '../query'
import type {MessStory} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@frogpond/double-tap', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./double-tap-mock') as typeof import('./double-tap-mock')
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

const mockGoBack = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useNavigation: () => ({goBack: mockGoBack}),
}))

const COMIC: MessStory = {
	id: 36819,
	title: 'Mouse Friends: sunsets of life',
	excerpt: '',
	link: 'https://olafmessenger.com/36819/',
	published: '2026-04-20T12:00:00.000Z',
	section: 'Variety',
	column: 'Comic',
	featured: false,
	bylines: [{id: 381, name: 'Juliet Stouffer'}],
	photo: null,
	blocks: [],
	layout: {kind: 'image', image: {url: 'https://olafmessenger.com/c.png', width: 800, height: 600}},
}

const ARTICLE: MessStory = {...COMIC, id: 36911, title: 'An article', layout: {kind: 'article'}}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.feed, [COMIC, ARTICLE])
})

afterEach(() => {
	queryClient.clear()
	// Mess queries fetch their categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderViewer(id: number) {
	return render(
		<QueryClientProvider client={queryClient}>
			<ImageViewer id={id} />
		</QueryClientProvider>,
	)
}

describe('ImageViewer', () => {
	test("shows the story's image, named by its title and writer", async () => {
		await renderViewer(36819)

		expect(
			screen.getByRole('image', {name: 'Mouse Friends: sunsets of life, by Juliet Stouffer'}),
		).toBeTruthy()
	})

	test('closes on Close', async () => {
		await renderViewer(36819)

		fireEvent.press(screen.getByRole('button', {name: 'Close'}))

		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	test('closes on the VoiceOver escape gesture', async () => {
		await renderViewer(36819)

		// The gesture is handled by the page, so it closes from anywhere in the viewer.
		fireEvent(
			screen.getByRole('image', {name: 'Mouse Friends: sunsets of life, by Juliet Stouffer'}),
			'accessibilityEscape',
		)

		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	test('says the image is unavailable for a story without one, and can still close', async () => {
		await renderViewer(36911)

		expect(screen.getByText('Image unavailable')).toBeTruthy()
		expect(screen.queryByRole('image')).toBeNull()
		expect(screen.getByRole('button', {name: 'Close'})).toBeTruthy()
	})
})
