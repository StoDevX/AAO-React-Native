import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen, within} from '@testing-library/react-native'
import {onlineManager, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import posts from './fixtures/posts.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {flushQueryNotifications} from '../../../testing/query-notifications'
import {IssuePage} from '../issue-page'
import {messKeys} from '../lib/keys'
import type {MessIssue, MessStory} from '../types'

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

const ISSUE: MessIssue = {
	day: '2026-04-29',
	after: '2026-04-28T23:59:59',
	before: null,
	count: 5,
	leadId: 5,
	leadTitle: 'Student workers deliver petition',
	leadPhoto: 7,
	isSpecial: false,
}
const PHOTO = {url: 'https://olafmessenger.com/petition.jpg', width: 1200, height: 800, caption: ''}

function story(
	id: number,
	title: string,
	section: string | null,
	extra: Partial<MessStory> = {},
): MessStory {
	return {
		id,
		title,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: '2026-04-29T22:00:00.000Z',
		section,
		column: null,
		featured: false,
		bylines: [],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
		...extra,
	}
}

const STORIES = [
	story(5, 'Student workers deliver petition', 'News', {
		featured: true,
		photo: PHOTO,
		bylines: [{id: 1, name: 'Maya Betti'}],
	}),
	story(4, 'Hunger Free Campus grant', 'News', {photo: PHOTO}),
	story(3, 'Blazers on loan', 'News'),
	story(2, 'Cats or dogs?', 'Opinions', {column: 'Messenger Wars'}),
	story(1, 'Letter from the editors', 'Special Edition'),
]

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** Every string the tree draws, in reading order. */
function textsOf(node: Node | Node[] | string | null): string[] {
	if (node === null) return []
	if (typeof node === 'string') return [node]
	if (Array.isArray(node)) return node.flatMap(textsOf)
	return (node.children ?? []).flatMap(textsOf)
}

let queryClient: QueryClient
let onShowSection: jest.Mock<(section: string) => void>

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	onShowSection = jest.fn()
})

afterEach(() => {
	onlineManager.setOnline(true)
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderIssue(issue: MessIssue = ISSUE, showMasthead = true) {
	return render(
		<QueryClientProvider client={queryClient}>
			<IssuePage
				columnWidth={350}
				issue={issue}
				onShowSection={onShowSection}
				showMasthead={showMasthead}
			/>
		</QueryClientProvider>,
	)
}

describe('IssuePage', () => {
	test('lays an issue out under the masthead: its dateline, its lead, then a shelf per section', async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue()

		expect(screen.getByText('April 29, 2026 · 5 stories')).toBeTruthy()
		// VoiceOver reads the lead's section and writers after its headline, as drawn.
		expect(
			screen.getByRole('button', {name: 'Student workers deliver petition, News · Maya Betti'}),
		).toBeTruthy()
		let texts = textsOf(screen.toJSON() as Node | Node[] | null)
		let [news, opinions, more] = ['News', 'Opinions', 'More'].map((heading) =>
			texts.indexOf(heading),
		)
		expect(news).toBeGreaterThanOrEqual(0)
		expect(opinions).toBeGreaterThan(news)
		expect(more).toBeGreaterThan(opinions)
	})

	// The Issues row and Top's banner name the lead from the light fields; the page must agree
	// even when the full stories would pick another, as when a lead's photo fails to embed.
	test('leads with the story the issue list named, and leaves it off its shelf', async () => {
		let named = {...ISSUE, leadId: 4, leadTitle: 'Hunger Free Campus grant'}
		queryClient.setQueryData(messKeys.issue(named), STORIES)
		await renderIssue(named)

		expect(screen.getByRole('button', {name: 'Hunger Free Campus grant, News'})).toBeTruthy()
		expect(screen.getAllByRole('button', {name: /^Hunger Free Campus grant/u})).toHaveLength(1)
		expect(screen.getByRole('button', {name: 'Student workers deliver petition'})).toBeTruthy()
	})

	test('leaves the lead story off its shelf', async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue()

		expect(
			screen.getAllByRole('button', {name: /^Student workers deliver petition/u}),
		).toHaveLength(1)
	})

	test('gives a story with no photo a text-only card, named by its column or section', async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue()

		// VoiceOver reads a text card's column or section after its headline, as drawn.
		let textCard = screen.getByRole('button', {name: 'Cats or dogs?, Messenger Wars'})
		expect(within(textCard).getByText('Messenger Wars')).toBeTruthy()
		let sectionCard = screen.getByRole('button', {name: 'Blazers on loan, News'})
		expect(within(sectionCard).getByText('News')).toBeTruthy()
		let photoCard = screen.getByRole('button', {name: 'Hunger Free Campus grant'})
		expect(within(photoCard).queryByText('News')).toBeNull()
	})

	test('"All ›" asks for its section; the More shelf has none', async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue()

		await fireEvent.press(screen.getByRole('button', {name: 'All Opinions'}))

		expect(onShowSection).toHaveBeenCalledWith('Opinions')
		expect(screen.queryByRole('button', {name: 'All More'})).toBeNull()
	})

	test("opens a card's story, and the lead's, in the reader", async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue()

		await fireEvent.press(screen.getByRole('button', {name: 'Hunger Free Campus grant'}))
		await fireEvent.press(
			screen.getByRole('button', {name: 'Student workers deliver petition, News · Maya Betti'}),
		)

		expect(mockNavigate.mock.calls).toStrictEqual([
			[{pathname: '/Messenger/story', params: {id: '4'}}],
			[{pathname: '/Messenger/story', params: {id: '5'}}],
		])
	})

	test("offers Try Again when the issue's stories fail, and lays them out once they load", async () => {
		mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
		mockBody.mockImplementation((href) =>
			href.includes('/categories')
				? Promise.resolve(categoriesJson)
				: Promise.reject(new Error('offline')),
		)
		await renderIssue()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()

		mockBody.mockImplementation((href) =>
			Promise.resolve(href.includes('/categories') ? categoriesJson : posts),
		)
		await act(async () => {
			fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))
			// `find` matches the whole key, so it names this issue's range exactly.
			await queryClient.getQueryCache().find({queryKey: messKeys.issue(ISSUE)})?.promise
			await flushQueryNotifications()
		})

		expect(screen.queryByRole('button', {name: 'Try Again'})).toBeNull()
		expect(
			screen.getByRole('button', {
				name: 'Student workers deliver petition urging St. Olaf to reverse work award cap policy, News · Maya Betti',
			}),
		).toBeTruthy()
	})

	test('says it loads once back online, rather than spinning, when offline with nothing cached', async () => {
		onlineManager.setOnline(false)
		await renderIssue()

		expect(screen.getByText('No connection. This page loads when you’re back online.')).toBeTruthy()
	})

	test('opens with its dateline alone when it has a page of its own', async () => {
		queryClient.setQueryData(messKeys.issue(ISSUE), STORIES)
		await renderIssue(ISSUE, false)

		expect(screen.getByText('April 29, 2026 · 5 stories')).toBeTruthy()
	})
})
