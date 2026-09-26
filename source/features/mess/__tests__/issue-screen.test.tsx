import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {IssueScreen} from '../issue-screen'
import {messKeys} from '../lib/keys'
import {OLAF_MESSENGER} from '../../news/sources'
import {useNewsFilterStore} from '../../news/store'
import type {LightPost, MessStory} from '../types'

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
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)
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
		messKeys.issue({after: '2026-03-24T23:59:59', before: '2026-04-29T00:00:00', count: 5}),
		MARCH,
	)
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderIssue(day: string) {
	return render(
		<QueryClientProvider client={queryClient}>
			<IssueScreen day={day} />
		</QueryClientProvider>,
	)
}

describe('IssueScreen', () => {
	test('lays out the issue its day names, under its dateline alone', async () => {
		await renderIssue('2026-03-25')

		expect(screen.getByText('March 25, 2026 · 5 stories')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'March story 0, News'})).toBeTruthy()
	})

	test('"All ›" goes back to the front page, showing that section', async () => {
		await renderIssue('2026-03-25')

		await fireEvent.press(screen.getByRole('button', {name: 'All Opinions'}))

		expect(useNewsFilterStore.getState().selectedCategories[OLAF_MESSENGER.id]).toBe('Opinions')
		expect(mockBack).toHaveBeenCalledTimes(1)
	})

	test('says an issue the list does not hold is unavailable', async () => {
		await renderIssue('2026-01-01')

		expect(screen.getByText('Issue unavailable')).toBeTruthy()
	})
})
