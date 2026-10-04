import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {dehydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import {queryClient as appQueryClient, persistOptions} from '../../../init/tanstack-query'
import {navigationTitleLines} from '../../../testing/navigation-title'
import {flushQueryNotifications} from '../../../testing/query-notifications'
import {IssueScreen} from '../issue-screen'
import {messKeys} from '../lib/keys'
import {OLAF_MESSENGER} from '../../news/sources'
import {useNewsFilterStore} from '../../news/store'
import type {LightPost, MessStory} from '../types'

jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const mockNavigate = jest.fn()
const mockBack = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
	useNavigation: () => ({goBack: mockBack}),
}))

function story(id: number, title: string, section: string, day: string): MessStory {
	return {
		id,
		title,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: `${day}T22:00:00.000Z`,
		section,
		column: null,
		featured: false,
		bylines: [],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
	}
}

const light = (s: MessStory): LightPost => ({
	id: s.id,
	day: s.published.slice(0, 10),
	title: s.title,
	section: s.section,
	special: false,
	featured: false,
	photo: null,
	photoUrl: null,
})

/** Five stories a day on Apr 29 and Mar 25: two issues, the older ending where the newer begins. */
const APRIL = [0, 1, 2, 3, 4].map((n) =>
	story(20 - n, `April story ${n}`, n < 3 ? 'News' : 'Opinions', '2026-04-29'),
)
const MARCH = [0, 1, 2, 3, 4].map((n) =>
	story(10 - n, `March story ${n}`, n < 3 ? 'News' : 'Opinions', '2026-03-25'),
)

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	useNewsFilterStore.setState({selectedCategories: {}})
	queryClient.setQueryData(messKeys.issues, {
		pages: [[...APRIL, ...MARCH].map(light)],
		pageParams: [1],
	})
	queryClient.setQueryData(
		messKeys.issue({key: 'week:2026-03-23', storyIds: [10, 9, 8, 7, 6]}),
		MARCH,
	)
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderIssue(issueKey: string) {
	return render(
		<QueryClientProvider client={queryClient}>
			<IssueScreen issueKey={issueKey} />
		</QueryClientProvider>,
	)
}

describe('IssueScreen', () => {
	// A story can go up after the list was loaded, and the issue fetches its stories by the ids the
	// list gives it.
	test('pull-to-refresh fetches the issue list again, and with it a story added to the issue', async () => {
		/** A News post on Apr 29, as WordPress lists it. */
		let listed = (id: number) => ({
			id,
			date: '2026-04-29T17:00:00',
			title: {rendered: `April story ${id}`},
			categories: [45],
			featured_media: 0,
		})
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) => {
			if (href.includes('/categories')) return Promise.resolve(categoriesJson)
			if (href.includes('&page=1&')) return Promise.resolve([21, 20, 19, 18, 17, 16].map(listed))
			return Promise.resolve([])
		})
		queryClient.setQueryData(
			messKeys.issue({key: 'week:2026-04-27', storyIds: [20, 19, 18, 17, 16]}),
			APRIL,
		)
		await renderIssue('week:2026-04-27')

		let refresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>
		await act(async () => {
			await refresh()
			await flushQueryNotifications()
		})

		expect(mockBody.mock.calls.map((call) => call[0])).toContainEqual(
			expect.stringContaining('/posts?include=21,20,19,18,17,16&per_page=100&_embed=true'),
		)
	})

	test("lays out the issue its key names, titled with the paper's name over the issue's date", async () => {
		await renderIssue('week:2026-03-23')

		expect(navigationTitleLines()).toStrictEqual(['The Olaf Messenger', 'March 25, 2026'])
		expect(screen.getByRole('button', {name: 'March story 0, News'})).toBeTruthy()
	})

	test('"All ›" opens the list of this issue\'s stories in that section, leaving the front page be', async () => {
		await renderIssue('week:2026-03-23')

		await fireEvent.press(screen.getByRole('button', {name: 'All Opinions'}))

		expect(mockNavigate.mock.calls).toStrictEqual([
			[
				{
					pathname: '/messenger/issue-section',
					params: {key: 'week:2026-03-23', section: 'Opinions'},
				},
			],
		])
		expect(mockBack).not.toHaveBeenCalled()
		expect(useNewsFilterStore.getState().selectedCategories[OLAF_MESSENGER.id]).toBeUndefined()
	})

	// The newest issue is the front page's top tile, whose query is saved for the next launch.
	test('saves the newest issue for the next launch, and no older one', async () => {
		let april = {key: 'week:2026-04-27', storyIds: [20, 19, 18, 17, 16]}
		queryClient.setQueryData(messKeys.issue(april), APRIL)
		await renderIssue('week:2026-04-27')
		await renderIssue('week:2026-03-23')

		let saved = dehydrate(queryClient, persistOptions.dehydrateOptions).queries.map(
			(query) => query.queryKey,
		)
		expect(saved).toContainEqual(messKeys.issue(april))
		expect(saved).not.toContainEqual(
			messKeys.issue({key: 'week:2026-03-23', storyIds: [10, 9, 8, 7, 6]}),
		)
	})

	test('says an issue the list does not hold is unavailable', async () => {
		await renderIssue('week:2025-12-29')

		expect(screen.getByText('Issue Unavailable')).toBeTruthy()
	})
})
