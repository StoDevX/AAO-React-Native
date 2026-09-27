import * as React from 'react'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {Settings} from 'react-native'
import {QueryClient, QueryClientProvider, useQueryClient} from '@tanstack/react-query'
import {keys, type PostingUnits} from '@frogpond/ccc-jobs'
import {UITEST_POSTING_UNITS} from '@frogpond/ccc-jobs/fixtures/uitest-postings'
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
		await waitFor(() => expect(result.current.availability).toBe('ready'))

		let before = result.current.context
		await rerender({})
		expect(result.current.context).toBe(before)
	})

	// A refetch returning the same units changes nothing a list shows, and
	// must not rebuild every list's filters and sections.
	test('keeps its context when the units map refetches the same units', async () => {
		let {result} = await renderHook(
			() => ({board: useStudentWorkBoard(), client: useQueryClient()}),
			{wrapper: Wrapper},
		)
		await waitFor(() => expect(result.current.board.availability).toBe('ready'))

		let before = result.current.board.context
		await act(async () => {
			await result.current.client.refetchQueries({queryKey: keys.postingUnits})
		})
		expect(result.current.board.context).toBe(before)
	})

	test('sorts postings into areas by the published units', async () => {
		let {result} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})

		await waitFor(() =>
			expect(result.current.context.membership.get('dining')?.ids).toEqual(new Set(['uitest-3'])),
		)
	})

	test('reads a unit the map lacks from the posting’s detail', async () => {
		let {'uitest-3': _dining, ...withoutDining} = UITEST_POSTING_UNITS
		client.setQueryData<PostingUnits>(keys.postingUnits, withoutDining)

		let {result} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})

		await waitFor(() =>
			expect(result.current.context.membership.get('dining')?.ids).toEqual(new Set(['uitest-3'])),
		)
		expect(client.getQueryData(keys.detail('uitest-3'))).toBeDefined()
		expect(client.getQueryData(keys.detail('uitest-1'))).toBeUndefined()
	})

	test('with no map and nothing saved, reads no details and knows no areas', async () => {
		client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		let get = jest
			.spyOn(Settings, 'get')
			.mockImplementation((key: string) => key === 'AAOUITestStudentWorkUnitsUnavailable')

		let {result} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})

		await waitFor(() => expect(result.current.availability).toBe('unavailable'))
		expect(result.current.context.membership.size).toBe(0)
		expect(client.getQueryCache().findAll({queryKey: ['jobs', 'detail']})).toEqual([])
		get.mockRestore()
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

	test('refresh refetches the units map', async () => {
		let {result} = await renderHook(
			() => ({board: useStudentWorkBoard(), client: useQueryClient()}),
			{wrapper: Wrapper},
		)
		await waitFor(() => expect(result.current.board.availability).toBe('ready'))
		let before = result.current.client.getQueryState(keys.postingUnits)?.dataUpdateCount ?? 0

		await act(async () => {
			await result.current.board.refresh()
		})

		expect(result.current.client.getQueryState(keys.postingUnits)?.dataUpdateCount).toBeGreaterThan(
			before,
		)
	})
})
