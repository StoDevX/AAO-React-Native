import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {onlineManager, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {messKeys} from '../lib/keys'
import {parseMessCategories} from '../lib/posts'
import {SectionStories} from '../section-page'
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
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const NEWS = 7
const GRANT: MessStory = {
	id: 36896,
	title: 'Hunger Free Campus grant',
	excerpt: '',
	link: 'https://olafmessenger.com/36896/',
	published: '2026-04-29T22:00:00.000Z',
	section: 'News',
	column: null,
	featured: true,
	bylines: [{id: 1, name: 'Maya Betti'}],
	photo: null,
	blocks: [],
	layout: {kind: 'article'},
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.categories, parseMessCategories(categoriesJson))
})

afterEach(() => {
	onlineManager.setOnline(true)
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderSection(name = 'News') {
	return render(
		<QueryClientProvider client={queryClient}>
			<SectionStories name={name} />
		</QueryClientProvider>,
	)
}

describe('SectionStories', () => {
	test("offers a section's columns A–Z as chips, above its newest stories", async () => {
		queryClient.setQueryData(messKeys.category(NEWS), [GRANT])
		await renderSection()

		expect(
			screen.getAllByRole('button').map((button) => button.props.accessibilityLabel),
		).toStrictEqual([
			'2024 Elections',
			'Good Questions',
			'Local Finds',
			'Hunger Free Campus grant, Maya Betti · Apr 29',
		])
		expect(screen.getByRole('button', {name: 'Good Questions', selected: false})).toBeTruthy()
	})

	// Every print section has a column today, so the tree here drops Opinions' one column.
	test('offers no column chips for a section without columns', async () => {
		const OPINIONS = 8
		queryClient.setQueryData(
			messKeys.categories,
			parseMessCategories(categoriesJson).filter((category) => category.parent !== OPINIONS),
		)
		queryClient.setQueryData(messKeys.category(OPINIONS), [GRANT])
		await renderSection('Opinions')

		expect(
			screen.getAllByRole('button').map((button) => button.props.accessibilityLabel),
		).toStrictEqual(['Hunger Free Campus grant, Maya Betti · Apr 29'])
	})

	test('opens a column on a page of its own, and a story in the reader', async () => {
		queryClient.setQueryData(messKeys.category(NEWS), [GRANT])
		await renderSection()

		await fireEvent.press(screen.getByRole('button', {name: 'Good Questions'}))
		await fireEvent.press(
			screen.getByRole('button', {name: 'Hunger Free Campus grant, Maya Betti · Apr 29'}),
		)

		expect(mockNavigate.mock.calls).toStrictEqual([
			[{pathname: '/messenger/column', params: {id: '65'}}],
			[{pathname: '/messenger/story', params: {id: '36896'}}],
		])
	})

	// WordPress could rename or drop a section a saved chip still names.
	test('says the section is missing when the categories have no such section', async () => {
		const NEWS = 7
		queryClient.setQueryData(
			messKeys.categories,
			parseMessCategories(categoriesJson).filter(
				(category) => category.id !== NEWS && category.parent !== NEWS,
			),
		)
		await renderSection('News')

		expect(screen.getByText('The Mess has no News section right now.')).toBeTruthy()
	})

	test('says it loads once back online when offline with its sections not cached', async () => {
		queryClient.removeQueries({queryKey: messKeys.categories})
		onlineManager.setOnline(false)
		await renderSection()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('says its stories load once back online when offline with them not cached', async () => {
		onlineManager.setOnline(false)
		await renderSection()

		expect(screen.getByRole('button', {name: 'Good Questions'})).toBeTruthy()
		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('offers Try Again when its stories fail, and still offers its columns', async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockRejectedValue(new Error('offline'))
		await renderSection()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Good Questions'})).toBeTruthy()
	})
})
