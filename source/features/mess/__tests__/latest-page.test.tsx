import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {LatestPage} from '../latest-page'
import {messKeys} from '../lib/keys'
import {parseMessCategories} from '../lib/posts'
import type {MessStory} from '../types'

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
		queryClient.setQueryData(messKeys.feed, [WATERS, GRANT])
		await renderLatest(null)

		expect(
			screen.getAllByRole('button').map((button) => button.props.accessibilityLabel),
		).toStrictEqual([
			'I grew up in the Boundary Waters, Maya Betti · Apr 29',
			'Hunger Free Campus grant, Maya Betti · Apr 29',
		])
	})

	test('narrowed to a section, lists that section with its columns', async () => {
		queryClient.setQueryData(messKeys.category(NEWS), [GRANT])
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
