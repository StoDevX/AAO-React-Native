import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {ImageViewer} from '../image-viewer'
import {messKeys} from '../lib/keys'
import type {MessStory} from '../types'

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

const mockShareImage = jest.fn<(uri: string) => Promise<void>>()
jest.mock('../../../components/lib/share-image', () => ({
	shareImage: (uri: string) => mockShareImage(uri),
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

const BEES = {url: 'https://olafmessenger.com/bees-1.jpg', width: 300, height: 200, caption: ''}
/** The cup picture's largest copy, from its srcset. */
const LARGE_CUP = 'https://olafmessenger.com/bees-2-1536x1024.jpg'
const CUP = {
	url: 'https://olafmessenger.com/bees-2.jpg',
	largeUrl: LARGE_CUP,
	width: 300,
	height: 200,
	caption: 'At the cup',
}

/** A Photo post's set of two pictures. */
const PHOTO_SET: MessStory = {
	...COMIC,
	id: 33129,
	title: 'Bees drinking lemonade',
	column: 'Photo',
	layout: {kind: 'feature', images: [BEES, CUP]},
}

/** A Photo post that lost its picture. */
const NO_PICTURE: MessStory = {
	...COMIC,
	id: 28051,
	title: 'Untitled',
	column: 'Photo',
	layout: {kind: 'feature', images: []},
}

const LEAD = {
	url: 'https://olafmessenger.com/lead.jpg',
	width: 600,
	height: 400,
	caption: 'Students deliver the petition.',
}
const FIGURE = {url: 'https://olafmessenger.com/figure.jpg', width: 600, height: 400}
/** The figure's largest copy, from its srcset. */
const LARGE_FIGURE = 'https://olafmessenger.com/figure-1536x1024.jpg'

/** An article with a captioned lead photo, a captioned figure and one with no caption. */
const ILLUSTRATED: MessStory = {
	...COMIC,
	id: 36859,
	title: 'Student workers deliver petition',
	column: null,
	photo: LEAD,
	blocks: [
		{type: 'paragraph', runs: [{text: 'On Tuesday.'}]},
		{type: 'figure', ...FIGURE, caption: 'The petition, signed.', largeUrl: LARGE_FIGURE},
		{
			type: 'figure',
			url: 'https://olafmessenger.com/bare.jpg',
			width: 300,
			height: 200,
			caption: '',
		},
	],
	layout: {kind: 'article'},
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.feed, [COMIC, ARTICLE, PHOTO_SET, NO_PICTURE, ILLUSTRATED])
})

afterEach(() => {
	queryClient.clear()
	// Mess queries fetch their categories through the app's own client, whose cached queries
	// hold a day-long gc timer that would keep Jest running.
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderViewer(id: number, index?: number, url?: string) {
	return render(
		<QueryClientProvider client={queryClient}>
			<ImageViewer id={id} index={index} url={url} />
		</QueryClientProvider>,
	)
}

describe('ImageViewer', () => {
	test('shows the largest copy of the picture of a feature page that was tapped', async () => {
		await renderViewer(33129, 1)
		expect(screen.getByTestId('mess-image-viewer-image').props.source).toStrictEqual({
			uri: LARGE_CUP,
		})
	})

	test("shows a feature page's first picture when given no index", async () => {
		await renderViewer(33129)
		expect(screen.getByTestId('mess-image-viewer-image').props.source).toStrictEqual({
			uri: BEES.url,
		})
	})

	test('says the image is unavailable for an index with no picture, and can still close', async () => {
		await renderViewer(33129, 2)

		expect(screen.getByText('Image Unavailable')).toBeTruthy()
		await fireEvent.press(screen.getByRole('button', {name: 'Close'}))
		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	test('says the image is unavailable for an index that is not a number', async () => {
		await renderViewer(33129, Number('first'))
		expect(screen.getByText('Image Unavailable')).toBeTruthy()
	})

	test('says the image is unavailable for a feature page with no pictures', async () => {
		await renderViewer(28051)
		expect(screen.getByText('Image Unavailable')).toBeTruthy()
	})

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

		expect(screen.getByText('Image Unavailable')).toBeTruthy()
		expect(screen.queryByRole('image')).toBeNull()
		expect(screen.getByRole('button', {name: 'Close'})).toBeTruthy()
	})

	test('shares the picture it shows on Share', async () => {
		mockShareImage.mockResolvedValue(undefined)
		await renderViewer(33129, 1)

		fireEvent.press(screen.getByRole('button', {name: 'Share'}))

		expect(mockShareImage).toHaveBeenCalledWith(LARGE_CUP)
	})

	test('offers no Share when there is no picture', async () => {
		await renderViewer(36911)
		expect(screen.queryByRole('button', {name: 'Share'})).toBeNull()
	})

	test("shows a story's lead photo by its address, named by its caption", async () => {
		await renderViewer(36859, undefined, LEAD.url)
		expect(
			screen.getByRole('image', {name: 'Students deliver the petition.'}).props.source,
		).toStrictEqual({uri: LEAD.url})
	})

	test("shows the largest copy of a figure in a story's body, found by its address", async () => {
		await renderViewer(36859, undefined, FIGURE.url)
		expect(screen.getByRole('image', {name: 'The petition, signed.'}).props.source).toStrictEqual({
			uri: LARGE_FIGURE,
		})
	})

	test('shows a figure with no larger copy as the article does', async () => {
		await renderViewer(36859, undefined, 'https://olafmessenger.com/bare.jpg')
		expect(screen.getByTestId('mess-image-viewer-image').props.source).toStrictEqual({
			uri: 'https://olafmessenger.com/bare.jpg',
		})
	})

	test('names a figure with no caption by its story', async () => {
		await renderViewer(36859, undefined, 'https://olafmessenger.com/bare.jpg')
		expect(
			screen.getByRole('image', {name: 'Student workers deliver petition, by Juliet Stouffer'}),
		).toBeTruthy()
	})

	test('says the image is unavailable for an address that is not one of the story’s', async () => {
		await renderViewer(36859, undefined, 'https://example.com/elsewhere.jpg')
		expect(screen.getByText('Image Unavailable')).toBeTruthy()
		expect(screen.queryByRole('image')).toBeNull()
	})

	test('shares the largest copy of a figure it was given by its address', async () => {
		mockShareImage.mockResolvedValue(undefined)
		await renderViewer(36859, undefined, FIGURE.url)

		fireEvent.press(screen.getByRole('button', {name: 'Share'}))

		expect(mockShareImage).toHaveBeenCalledWith(LARGE_FIGURE)
	})
})
