import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'
import categories from './fixtures/categories.json'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {ImageView} from '../image-view'
import {SeriesRow} from '../series-row'
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
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

// The series' fetches, so an uncached series never reaches a network Jest does not have.
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const IMAGE = {url: 'https://olafmessenger.com/comic.png', width: 1000, height: 1400}

const COMIC: MessStory = {
	id: 36819,
	title: 'Mouse Friends: sunsets of life',
	excerpt: '',
	link: 'https://olafmessenger.com/36819/',
	published: '2026-04-20T12:00:00.000Z',
	section: 'Variety',
	column: 'Comic',
	featured: false,
	bylines: [
		{id: 381, name: 'Juliet Stouffer'},
		{id: 382, name: 'Ada Lin'},
	],
	photo: null,
	blocks: [],
	layout: {kind: 'image', image: IMAGE},
}

const EPISODE_TWO: MessStory = {...COMIC, id: 2, title: 'Mouse Friends episode 2: Mary! Gold!'}
const EPISODE_ONE: MessStory = {
	...COMIC,
	id: 1,
	title: 'Mouse Friends Episode One: bickering',
	layout: {kind: 'article'},
	photo: {...IMAGE, caption: ''},
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
})

afterEach(() => {
	queryClient.clear()
	// The series fetches its categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderWithClient(ui: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ImageView', () => {
	test('names the image by its title and writers', async () => {
		await renderWithClient(<ImageView columnWidth={300} image={IMAGE} story={COMIC} />)

		expect(
			screen.getByRole('button', {
				name: 'Mouse Friends: sunsets of life, by Juliet Stouffer and Ada Lin',
			}),
		).toBeTruthy()
	})

	test('opens the image in the viewer', async () => {
		await renderWithClient(<ImageView columnWidth={300} image={IMAGE} story={COMIC} />)

		fireEvent.press(screen.getByRole('button', {name: /^Mouse Friends: sunsets of life, by/u}))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Messenger/image',
			params: {id: '36819'},
		})
	})
})

describe('SeriesRow', () => {
	test('shows the series under its heading, one button per story', async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {
			title: 'More Mouse Friends',
			stories: [EPISODE_TWO, EPISODE_ONE],
		})
		await renderWithClient(<SeriesRow story={COMIC} />)

		expect(screen.getByText('More Mouse Friends')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Mouse Friends episode 2: Mary! Gold!'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Mouse Friends Episode One: bickering'})).toBeTruthy()
	})

	test('opens a story from the row in the reader', async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {
			title: 'More Mouse Friends',
			stories: [EPISODE_TWO, EPISODE_ONE],
		})
		await renderWithClient(<SeriesRow story={COMIC} />)

		fireEvent.press(screen.getByRole('button', {name: 'Mouse Friends Episode One: bickering'}))

		expect(mockNavigate).toHaveBeenCalledWith({pathname: '/Messenger/story', params: {id: '1'}})
	})

	test('shows nothing for a series with no other stories', async () => {
		queryClient.setQueryData(messKeys.series(COMIC.id), {title: 'More by Juliet', stories: []})
		await renderWithClient(<SeriesRow story={COMIC} />)

		expect(screen.queryByText('More by Juliet')).toBeNull()
		expect(screen.queryByRole('button')).toBeNull()
	})

	test('shows nothing when the series fails to load', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			href.includes('/categories')
				? Promise.resolve(categories)
				: Promise.reject(new Error('offline')),
		)
		await renderWithClient(<SeriesRow story={COMIC} />)

		await waitFor(() =>
			expect(queryClient.getQueryState(messKeys.series(COMIC.id))?.status).toBe('error'),
		)
		expect(screen.queryByText(/^More/u)).toBeNull()
		expect(screen.queryByRole('button')).toBeNull()
	})
})
