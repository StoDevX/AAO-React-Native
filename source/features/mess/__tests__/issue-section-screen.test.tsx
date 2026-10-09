import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {navigationTitleLines} from '../../../testing/navigation-title'
import {IssueSectionScreen} from '../issue-section-screen'
import {messKeys} from '../lib/keys'
import type {LightPost, MessStory} from '../types'
import {InMessenger} from './in-messenger'

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
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

function story(id: number, title: string, section: string): MessStory {
	return {
		id,
		title,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: '2026-03-25T22:00:00.000Z',
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

/** One issue: its lead, the newest News story, then two more News stories and two Opinions. */
const MARCH = [
	story(10, 'Regents approve budget', 'News'),
	story(9, 'Cats or dogs?', 'Opinions'),
	story(8, 'Blazers on loan', 'News'),
	story(7, 'In defense of the Cage', 'Opinions'),
	story(6, 'Library hours grow', 'News'),
]
const KEY = 'week:2026-03-23'

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	queryClient.setQueryData(messKeys.issues, {pages: [MARCH.map(light)], pageParams: [1]})
	queryClient.setQueryData(messKeys.issue({key: KEY, storyIds: MARCH.map((s) => s.id)}), MARCH)
	mockManifest.mockRejectedValue(new Error('no fetch expected'))
	mockBody.mockRejectedValue(new Error('no fetch expected'))
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderSection(issueKey: string, section: string) {
	return render(
		<QueryClientProvider client={queryClient}>
			<InMessenger>
				<IssueSectionScreen issueKey={issueKey} section={section} />
			</InMessenger>
		</QueryClientProvider>,
	)
}

describe('IssueSectionScreen', () => {
	test("is titled with the section, over the issue's date", async () => {
		await renderSection(KEY, 'News')

		expect(navigationTitleLines()).toStrictEqual(['News', 'March 25, 2026'])
	})

	test("lists the issue's stories in the section, its lead among them, from the issue already loaded", async () => {
		await renderSection(KEY, 'News')

		let rows = screen.getAllByRole('button', {name: /^(Regents|Blazers|Library|Cats|In defense)/u})
		expect(rows.map((row) => row.props.accessibilityLabel)).toStrictEqual([
			expect.stringMatching(/^Regents approve budget, /u),
			expect.stringMatching(/^Blazers on loan, /u),
			expect.stringMatching(/^Library hours grow, /u),
		])
		expect(mockBody).not.toHaveBeenCalled()
	})

	test('opens a story in the reader', async () => {
		await renderSection(KEY, 'Opinions')

		await fireEvent.press(screen.getByRole('button', {name: /^Cats or dogs\?, /u}))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/messenger/story',
			params: {id: '9'},
		})
	})

	test('says an issue the list does not hold is unavailable', async () => {
		await renderSection('week:2025-12-29', 'News')

		expect(screen.getByText('Issue Unavailable')).toBeTruthy()
	})
})
