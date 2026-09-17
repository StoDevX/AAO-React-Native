import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import type {SqlRunner} from '../../sql'
import {useEvent} from '../read'

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
