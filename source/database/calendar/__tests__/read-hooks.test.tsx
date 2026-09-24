import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {SqlRunner} from '../../sql'
import {useEvent, useNeighbours} from '../read'
import {bumpCalendarRevision} from '../revision'

// `client.ts` reaches `expo-sqlite`, a native module Jest cannot load. The
// runner stands in for the database so a test can make a read throw.
const mockAll = jest.fn<SqlRunner['all']>()
jest.mock('../../client', () => ({
	getRunner: () => ({all: mockAll, exec: jest.fn(), run: jest.fn(), transaction: jest.fn()}),
}))
// `read.ts` reports a failed read; `@sentry/react-native` ships ESM-only and
// Jest has nothing to transform it with.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
	mockAll.mockReset()
	jest.useRealTimers()
})

describe('useEvent', () => {
	test('an event with no row reads as missing, not as a failed read', async () => {
		// A refresh can rekey or delete the event an open detail screen names.
		mockAll.mockReturnValue([])

		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		trackedQueryClients.push(client)
		let wrapper = ({children}: {children: React.ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		let {result} = await renderHook(() => useEvent('stolaf', 'gone', ['stolaf']), {wrapper})

		await waitFor(() => expect(result.current.isPending).toBe(false))
		expect(result.current.error).toBeNull()
		expect(result.current.event).toBeUndefined()
	})

	test('while Try Again waits to retry a failed read, it is pending rather than missing', async () => {
		mockAll.mockImplementation(() => {
			throw new Error('disk I/O error')
		})

		// The app retries a failed read with a backoff; the test looks at the hook
		// in the gap between attempts. Fake timers keep that gap from being real
		// time, and from outliving the test.
		jest.useFakeTimers()
		let client = new QueryClient({
			defaultOptions: {queries: {retry: 1, retryDelay: 60_000}},
		})
		trackedQueryClients.push(client)
		let wrapper = ({children}: {children: React.ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		let {result, unmount} = await renderHook(() => useEvent('stolaf', 'key', ['stolaf']), {wrapper})
		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})
		await waitFor(() => expect(result.current.error).not.toBeNull())

		await act(() => {
			result.current.refetch()
		})
		await waitFor(() => expect(mockAll.mock.calls.length).toBe(3))

		// No event and no error is what the detail screen reads as "this event
		// does not exist", so the hook has to say the read is still going.
		await waitFor(() => expect(result.current.error).toBeNull())
		expect(result.current.event).toBeUndefined()
		expect(result.current.isPending).toBe(true)

		// Let the waiting retry run out, so no timer outlives the test.
		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})
		await unmount()
	})
})

describe('useNeighbours', () => {
	test('reads nothing when the event has no timeline to draw', async () => {
		// A read that would succeed if it ran, so nothing here fails for want of
		// a fixture -- only for the hook having run a read at all.
		mockAll.mockReturnValue([])

		let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		trackedQueryClients.push(client)
		let wrapper = ({children}: {children: React.ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		let {result} = await renderHook(
			() => useNeighbours({window: null, sourceIds: ['stolaf'], exclude: []}),
			{
				wrapper,
			},
		)

		await waitFor(() => expect(result.current).toEqual([]))

		// Idle and pending, never fetched and never failed: a window that cannot
		// be built into a statement must not reach one. Asserting only that the
		// runner went uncalled would pass either way -- `occurrencesQuery` throws
		// on a null window before it gets that far -- and a thrown read is the
		// detail screen's error state, not "no neighbours".
		let [query] = client.getQueryCache().getAll()
		expect(query?.state.fetchStatus).toBe('idle')
		expect(query?.state.status).toBe('pending')
		expect(mockAll).not.toHaveBeenCalled()
	})
})

describe('after a write', () => {
	test('the read it replaced does not stay cached', async () => {
		mockAll.mockReturnValue([])

		// The app-wide default keeps an unwatched query for a day, which is
		// what a read left behind by a revision bump would otherwise get.
		let client = new QueryClient({defaultOptions: {queries: {retry: false, gcTime: 86_400_000}}})
		trackedQueryClients.push(client)
		let wrapper = ({children}: {children: React.ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		let {result, unmount} = await renderHook(() => useEvent('stolaf', 'key', ['stolaf']), {wrapper})
		await waitFor(() => expect(result.current.isPending).toBe(false))

		let revisionBeforeBump = client.getQueryCache().getAll()[0].queryKey[2] as number
		let revisionAfterBump = revisionBeforeBump + 1
		await act(() => {
			bumpCalendarRevision()
		})
		await waitFor(() =>
			expect(
				client
					.getQueryCache()
					.getAll()
					.map((query) => query.queryKey[2]),
			).toStrictEqual([revisionAfterBump]),
		)

		await unmount()
	})

	test('the current read stays cached while its screen is closed', async () => {
		// Leaving Calendar for a minute and coming back should not re-read and
		// re-hydrate the whole window.
		mockAll.mockReturnValue([])
		jest.useFakeTimers()

		let client = new QueryClient({defaultOptions: {queries: {retry: false, gcTime: 86_400_000}}})
		trackedQueryClients.push(client)
		let wrapper = ({children}: {children: React.ReactNode}) => (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		)

		let {result, unmount} = await renderHook(() => useEvent('stolaf', 'key', ['stolaf']), {wrapper})
		await waitFor(() => expect(result.current.isPending).toBe(false))
		await unmount()

		await act(async () => {
			await jest.advanceTimersByTimeAsync(60_000)
		})
		expect(client.getQueryCache().getAll()).toHaveLength(1)
	})
})
