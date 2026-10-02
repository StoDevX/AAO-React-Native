import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {flushQueryNotifications} from '../../../testing/query-notifications'
import {BylineAvatar} from '../byline-avatar'
import {messKeys} from '../lib/keys'
import type {Byline, StaffProfile} from '../types'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

const WRITER: Byline = {id: 392, name: 'Kenzie Nguyen'}

const PROFILE: StaffProfile = {
	name: 'Kenzie Nguyen',
	bio: 'Kenzie is a senior.',
	photo: {url: 'https://x.test/kenzie.jpg', width: 300, height: 300},
	year: '2025-2026',
}

const PLACEHOLDER = 'mess-byline-avatar-placeholder'

type Node = {type: string; props: Record<string, unknown>; children: Array<Node | string> | null}

/** The sources of every rendered image, depth first. */
function imageUris(node: Node | Node[] | null): unknown[] {
	if (node === null) return []
	if (Array.isArray(node)) return node.flatMap(imageUris)
	let children = (node.children ?? []).filter((child): child is Node => typeof child !== 'string')
	let own = node.type === 'Image' ? [(node.props.source as {uri: string}).uri] : []
	return [...own, ...imageUris(children)]
}

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
})

afterEach(() => {
	queryClient.clear()
})

async function renderAvatar(writer: Byline | undefined) {
	await render(
		<QueryClientProvider client={queryClient}>
			<BylineAvatar writer={writer} />
		</QueryClientProvider>,
	)
}

describe('BylineAvatar', () => {
	// The placeholder holds the photo's place so the byline does not move when it arrives.
	test('holds the place while the profile is loading', async () => {
		// A fetch already in flight, which the avatar's own query joins rather than repeats.
		let unanswered = Promise.withResolvers<StaffProfile | null>()
		// Settled rather than voided: clearing the client after the test cancels the fetch.
		void Promise.allSettled([
			queryClient.query({queryKey: messKeys.profile(WRITER.id), queryFn: () => unanswered.promise}),
		])
		await renderAvatar(WRITER)

		expect(screen.getByTestId(PLACEHOLDER)).toBeTruthy()
		expect(imageUris(screen.toJSON() as Node | Node[] | null)).toStrictEqual([])
	})

	test("draws the writer's photo once the profile has one", async () => {
		queryClient.setQueryData(messKeys.profile(WRITER.id), PROFILE)
		await renderAvatar(WRITER)

		expect(screen.queryByTestId(PLACEHOLDER)).toBeNull()
		expect(imageUris(screen.toJSON() as Node | Node[] | null)).toStrictEqual([
			'https://x.test/kenzie.jpg',
		])
	})

	// Many writers have no profile, or one with no photo; their bylines sit flush with no gap.
	test('draws nothing for a writer with no profile', async () => {
		queryClient.setQueryData(messKeys.profile(WRITER.id), null)
		await renderAvatar(WRITER)

		expect(screen.toJSON()).toBeNull()
	})

	test('draws nothing for a profile with no photo', async () => {
		queryClient.setQueryData(messKeys.profile(WRITER.id), {...PROFILE, photo: null})
		await renderAvatar(WRITER)

		expect(screen.toJSON()).toBeNull()
	})

	test('gives the place back when the profile fails to load', async () => {
		let answer = Promise.withResolvers<StaffProfile | null>()
		let fetching = Promise.allSettled([
			queryClient.query({queryKey: messKeys.profile(WRITER.id), queryFn: () => answer.promise}),
		])
		await renderAvatar(WRITER)
		expect(screen.getByTestId(PLACEHOLDER)).toBeTruthy()

		await act(async () => {
			answer.reject(new Error('offline'))
			await fetching
			await flushQueryNotifications()
		})

		expect(screen.toJSON()).toBeNull()
	})

	// A story with no byline asks for no profile, so there is nothing to wait for.
	test('draws nothing for a story with no writer', async () => {
		await renderAvatar(undefined)

		expect(screen.toJSON()).toBeNull()
	})
})
