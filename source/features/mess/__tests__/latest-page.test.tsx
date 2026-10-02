import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, SourceFetchError, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import postsJson from './fixtures/posts.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {LatestPage} from '../latest-page'
import {messKeys} from '../lib/keys'
import {onePage} from './one-page'
import {parseMessCategories} from '../lib/posts'
import type {MessStory} from '../types'
import {loadBeforeTests} from '../../../testing/load-before-tests'

loadBeforeTests('Image')

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: jest.fn()}),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const NEWS = 7

function story(id: number, title: string, section: string): MessStory {
	return {
		id,
		title,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: '2026-04-29T22:00:00.000Z',
		section,
		column: null,
		featured: false,
		bylines: [{id: 1, name: 'Maya Betti'}],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
	}
}

const GRANT = story(36896, 'Hunger Free Campus grant', 'News')
const WATERS = story(36900, 'I grew up in the Boundary Waters', 'Opinions')

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		Promise.resolve(href.includes('/categories') ? categoriesJson : answer(href)),
	)
}

/** The posts URLs fetched, in order. */
const postHrefs = () =>
	mockBody.mock.calls.map((call) => call[0]).filter((href) => href.includes('/posts'))

/** The number of story rows drawn. */
const storyRows = () =>
	screen.queryAllByRole('button').filter((button) => button.props.accessibilityLabel?.includes('·'))
		.length

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.categories, parseMessCategories(categoriesJson))
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderLatest(section: string | null) {
	return render(
		<QueryClientProvider client={queryClient}>
			<LatestPage section={section} />
		</QueryClientProvider>,
	)
}

describe('LatestPage', () => {
	test('lists the newest stories', async () => {
		queryClient.setQueryData(messKeys.feed, onePage([WATERS, GRANT]))
		// The end of the list asks for a second page, which WordPress has none of.
		serve(() => [])
		await renderLatest(null)

		expect(
			screen.getAllByRole('button').map((button) => button.props.accessibilityLabel),
		).toStrictEqual([
			'I grew up in the Boundary Waters, Maya Betti · Apr 29',
			'Hunger Free Campus grant, Maya Betti · Apr 29',
		])
		await waitForQueriesToSettle(queryClient)
	})

	test('narrowed to a section, lists that section with its columns', async () => {
		queryClient.setQueryData(messKeys.category(NEWS), onePage([GRANT]))
		await renderLatest('News')

		expect(
			screen.getAllByRole('button').map((button) => button.props.accessibilityLabel),
		).toStrictEqual([
			'2024 Elections',
			'Good Questions',
			'Local Finds',
			'Hunger Free Campus grant, Maya Betti · Apr 29',
		])
	})

	// The stand-in mounts the end row at once, as SwiftUI does once a reader scrolls to it.
	test('loads the next page of the newest stories each time the end comes into view, until the last', async () => {
		queryClient.setQueryData(messKeys.feed, onePage([WATERS, GRANT]))
		// Page 2 is as long as the first, so another is asked for; WordPress has none past it.
		serve((href) =>
			href.endsWith('&page=2')
				? postsJson.slice(0, 2)
				: Promise.reject(new SourceFetchError('Olaf Messenger fetch failed: 400', 400)),
		)
		await renderLatest(null)

		await waitFor(() => expect(storyRows()).toBe(4))
		await waitForQueriesToSettle(queryClient)
		expect(postHrefs()).toStrictEqual([
			'https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true&page=2',
			'https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true&page=3',
		])
		expect(storyRows()).toBe(4)
	})

	test("loads the next page of a section's stories as the end comes into view, and stops at a short one", async () => {
		let full = Array.from({length: 30}, (_, index) =>
			story(index + 1, `Story ${index + 1}`, 'News'),
		)
		queryClient.setQueryData(messKeys.category(NEWS), onePage(full))
		serve(() => postsJson)
		await renderLatest('News')

		await waitFor(() => expect(storyRows()).toBe(35))
		await waitForQueriesToSettle(queryClient)
		expect(postHrefs()).toStrictEqual([
			`https://olafmessenger.com/wp-json/wp/v2/posts?categories=${NEWS}&per_page=30&_embed=true&page=2`,
		])
	})

	test('asks for no more after a short first page', async () => {
		queryClient.setQueryData(messKeys.category(NEWS), onePage([GRANT]))
		serve(() => postsJson)
		await renderLatest('News')

		await waitForQueriesToSettle(queryClient)
		expect(postHrefs()).toStrictEqual([])
	})

	test('keeps the loaded stories when a later page fails, and offers Try Again at the end', async () => {
		queryClient.setQueryData(messKeys.feed, onePage([WATERS, GRANT]))
		serve(() => Promise.reject(new Error('offline')))
		await renderLatest(null)

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(storyRows()).toBe(2)
		await waitForQueriesToSettle(queryClient)
	})

	test('offers Try Again when the newest stories cannot load', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			href.includes('/categories')
				? Promise.resolve(categoriesJson)
				: Promise.reject(new Error('offline')),
		)
		await renderLatest(null)

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		await waitForQueriesToSettle(queryClient)
	})
})
