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

	// A search starting or finishing with the same postings changes nothing a
	// list shows, and must not rebuild every list's filters and sections.
	test('keeps its context when a unit search refetches the same postings', async () => {
		let {result} = await renderHook(
			() => ({board: useStudentWorkBoard(), client: useQueryClient()}),
			{wrapper: Wrapper},
		)
		await waitFor(() =>
			expect(result.current.board.context.membership.get('dining')?.settled).toBe(true),
		)

		let before = result.current.board.context
		await act(async () => {
			await result.current.client.refetchQueries({queryKey: keys.unit('22005')})
		})
		expect(result.current.board.context).toBe(before)
	})

	// Opening Student Work checks for new postings -- that is what the New dots
	// are for -- while a list opened from it reuses the board it just fetched.
	test('refetches a fresh board only when asked to on mount', async () => {
		let first = await renderHook(() => ({board: useStudentWorkBoard(), client: useQueryClient()}), {
			wrapper: Wrapper,
		})
		await waitFor(() => expect(first.result.current.board.jobs.length).toBeGreaterThan(0))
		let updates = () =>
			first.result.current.client.getQueryState(keys.postings)?.dataUpdateCount ?? 0
		let afterFirst = updates()

		let list = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})
		// Let the list's mount run its effects before counting.
		await act(() => Promise.resolve())
		expect(updates()).toBe(afterFirst)

		let landing = await renderHook(() => useStudentWorkBoard({checkForNewPostings: true}), {
			wrapper: Wrapper,
		})
		await waitFor(() => expect(updates()).toBeGreaterThan(afterFirst))
		await first.unmount()
		await list.unmount()
		await landing.unmount()
	})

	// A refresh retries what is stale or failed; re-running fresh searches
	// would make every pull wait on all fifty-one of them.
	test('refreshes stale unit searches and leaves fresh ones alone', async () => {
		let {result} = await renderHook(
			() => ({board: useStudentWorkBoard(), client: useQueryClient()}),
			{wrapper: Wrapper},
		)
		await waitFor(() =>
			expect(result.current.board.context.membership.get('dining')?.settled).toBe(true),
		)

		let updates = (unit: string) =>
			result.current.client.getQueryState(keys.unit(unit))?.dataUpdateCount ?? 0
		await act(async () => {
			await result.current.client.invalidateQueries({
				queryKey: keys.unit('22005'),
				refetchType: 'none',
			})
		})
		let staleBefore = updates('22005')
		let freshBefore = updates('16118')

		await act(async () => {
			await result.current.board.refresh()
		})
		expect(updates('22005')).toBeGreaterThan(staleBefore)
		expect(updates('16118')).toBe(freshBefore)
	})
})
