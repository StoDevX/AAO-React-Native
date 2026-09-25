import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {openUrl} from '@frogpond/open-url'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import {StoryScreen} from '../story-screen'
import {messKeys} from '../query'
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
jest.mock('expo-router', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('../../../testing/expo-router-mock'),
)
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

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
}

/** An Artwork post: the REST API gives it no body at all. */
const ARTWORK: MessStory = {
	...STORY,
	id: 36950,
	title: 'Spring Sketches',
	link: 'https://olafmessenger.com/36950/',
	blocks: [],
}

const PROFILE: StaffProfile = {
	name: 'Kenzie Nguyen',
	bio: 'Kenzie is a senior.',
	photo: null,
	year: '2025-2026',
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.feed, [STORY, ARTWORK])
	// Ashlyn has no profile; Kenzie has one.
	queryClient.setQueryData(messKeys.profile(423), null)
	queryClient.setQueryData(messKeys.profile(392), PROFILE)
})

afterEach(() => {
	queryClient.clear()
	jest.clearAllMocks()
})

function renderStory(id: number) {
	return render(
		<QueryClientProvider client={queryClient}>
			<StoryScreen id={id} />
		</QueryClientProvider>,
	)
}

describe('StoryScreen', () => {
	test('says a story is unavailable when it is not in the feed', async () => {
		await renderStory(1)
		expect(screen.getByText('Story unavailable')).toBeTruthy()
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
		await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

		expect(screen.getByText('Cows, Comments and Confessions')).toBeTruthy()
		expect(mockManifest).not.toHaveBeenCalled()
		expect(mockBody).not.toHaveBeenCalled()
	})

	test('says a story is unavailable when the id is not a number', async () => {
		await renderStory(Number('not-a-number'))
		expect(screen.getByText('Story unavailable')).toBeTruthy()
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
})
