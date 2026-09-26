import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import categoriesJson from './fixtures/categories.json'
import springPosts from './fixtures/issue-posts.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {IssueList} from '../issue-list'
import {messKeys} from '../lib/keys'
import type {LightPost, MessIssue} from '../types'
import {useMessIssues} from '../use-mess-issues'

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

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

/** The spring's three pages of light posts, as WordPress serves them. */
const PAGES = [springPosts.slice(0, 100), springPosts.slice(100, 200), springPosts.slice(200)]

/** Five posts on one day, so the day makes an issue; the first is the newest, with `first` set on it. */
function issueDay(
	day: string,
	section: string,
	newestId: number,
	first: Partial<LightPost>,
): LightPost[] {
	return [0, 1, 2, 3, 4].map((offset) => ({
		id: newestId - offset,
		day,
		title: `Story ${newestId - offset}`,
		section,
		special: section === 'Special Edition',
		featured: false,
		photo: null,
		photoUrl: null,
		...(offset === 0 ? first : {}),
	}))
}

const TWO_ISSUES = [
	...issueDay('2026-05-12', 'Special Edition', 15, {title: 'Letter from the editors'}),
	...issueDay('2026-04-29', 'News', 10, {
		title: 'Student workers deliver petition',
		featured: true,
		photo: 1,
		photoUrl: 'https://olafmessenger.com/petition.jpg',
	}),
]

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** The props of every rendered host element of `type`, depth first. */
function hostProps(node: Node | Node[] | null, type: string): Array<Record<string, unknown>> {
	if (node === null) return []
	if (Array.isArray(node)) return node.flatMap((n) => hostProps(n, type))
	let children = (node.children ?? []).filter((child): child is Node => typeof child !== 'string')
	return [...(node.type === type ? [node.props] : []), ...hostProps(children, type)]
}

/** Answers the categories URL with the fixture tree, and any other URL with `answer(href)`. */
function serve(answer: (href: string) => unknown): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockImplementation((href) =>
		Promise.resolve(href.includes('/categories') ? categoriesJson : answer(href)),
	)
}

/** The spring's pages by their number, and a photo address for any lead. */
function springPage(href: string): unknown {
	if (href.includes('/media')) return []
	let page = Number(/[?&]page=(\d+)/u.exec(href)?.[1])
	return PAGES[page - 1]
}

/** Which pages of the issue list were asked for, in order. */
function pagesFetched(): string[] {
	return mockBody.mock.calls
		.map((call) => call[0])
		.filter((href) => href.includes('_fields=id,date'))
		.map((href) => /[?&]page=(\d+)/u.exec(href)?.[1] ?? '?')
}

/** How many issue rows are drawn, by their story counts. */
const rowsDrawn = () => screen.queryAllByText(/^\d+ stories$/u).length

let queryClient: QueryClient
let onOpen: jest.Mock<(issue: MessIssue) => void>

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
	onOpen = jest.fn()
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

/** The issue list as the Issues chip draws it, once its first page has loaded. */
function Issues(): React.ReactNode {
	let {issues, query} = useMessIssues()
	return issues ? <IssueList issues={issues} onOpen={onOpen} query={query} /> : null
}

function renderIssues() {
	return render(
		<QueryClientProvider client={queryClient}>
			<Issues />
		</QueryClientProvider>,
	)
}

describe('IssueList', () => {
	test("shows each issue's date, lead and story count, naming a special edition first", async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [TWO_ISSUES], pageParams: [1]})
		await renderIssues()

		expect(screen.getByText('Special Edition · May 12, 2026')).toBeTruthy()
		expect(screen.getByText('Letter from the editors')).toBeTruthy()
		expect(
			screen.getByRole('button', {
				name: 'April 29, 2026, Student workers deliver petition, 5 stories',
			}),
		).toBeTruthy()

		await waitForQueriesToSettle(queryClient)
	})

	test("shows the lead's photo, and a tinted square for a lead with none", async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [TWO_ISSUES], pageParams: [1]})
		await renderIssues()

		let uris = hostProps(screen.toJSON() as Node | Node[] | null, 'Image').map(
			(props) => (props.source as {uri?: string} | undefined)?.uri,
		)
		expect(uris).toStrictEqual(['https://olafmessenger.com/petition.jpg'])

		await waitForQueriesToSettle(queryClient)
	})

	test('opens an issue', async () => {
		queryClient.setQueryData(messKeys.issues, {pages: [TWO_ISSUES], pageParams: [1]})
		await renderIssues()

		await fireEvent.press(
			screen.getByRole('button', {
				name: 'April 29, 2026, Student workers deliver petition, 5 stories',
			}),
		)

		expect(onOpen.mock.lastCall?.[0]).toMatchObject({day: '2026-04-29'})

		await waitForQueriesToSettle(queryClient)
	})

	// Page 2 completes Mar 18 but leaves the list's end on screen, so the end has to fetch again.
	test('fetches the next page each time the end comes into view, until the last', async () => {
		serve(springPage)
		await renderIssues()

		await waitFor(() => expect(rowsDrawn()).toBe(8))
		expect(pagesFetched()).toStrictEqual(['1', '2', '3'])

		await waitForQueriesToSettle(queryClient)
	})

	test('keeps the loaded issues when a further page fails, and offers Try Again at the end', async () => {
		serve((href) =>
			href.includes('page=1&') || href.includes('/media/')
				? springPage(href)
				: Promise.reject(new Error('offline')),
		)
		await renderIssues()

		expect(await screen.findByRole('button', {name: 'Try Again'})).toBeTruthy()
		expect(rowsDrawn()).toBe(3)

		serve(springPage)
		await fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))

		await waitFor(() => expect(rowsDrawn()).toBe(8))

		await waitForQueriesToSettle(queryClient)
	})
})
