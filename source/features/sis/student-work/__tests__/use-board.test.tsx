import * as React from 'react'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, useQueryClient} from '@tanstack/react-query'
import {keys} from '@frogpond/ccc-jobs'
import {useStudentWorkBoard} from '../use-board'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

let client = new QueryClient()

beforeEach(() => {
	client = new QueryClient()
})

// A client's garbage-collection timers would keep Jest from exiting.
afterEach(() => {
	client.clear()
})

function Wrapper({children}: {children: React.ReactNode}): React.ReactNode {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useStudentWorkBoard', () => {
	// Every screen's filters and sections key their memos on this; a context
	// rebuilt on every render -- each keystroke in the search field -- would
	// rebuild them all.
	test('hands back the same context across renders that change nothing', async () => {
		let {result, rerender} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})
		await waitFor(() => expect(result.current.context.membership.get('dining')?.settled).toBe(true))

		let before = result.current.context
		await rerender({})
		expect(result.current.context).toBe(before)
	})

	// A unit search that failed would otherwise stay failed until it went stale.
	test('refreshes the unit searches as well as the board', async () => {
		let {result} = await renderHook(
			() => ({board: useStudentWorkBoard(), client: useQueryClient()}),
			{wrapper: Wrapper},
		)
		await waitFor(() =>
			expect(result.current.board.context.membership.get('dining')?.settled).toBe(true),
		)

		let unitState = () => result.current.client.getQueryState(keys.unit('22005'))
		let before = unitState()?.dataUpdateCount ?? 0
		await act(async () => {
			await result.current.board.refresh()
		})
		expect(unitState()?.dataUpdateCount).toBeGreaterThan(before)
	})
})
