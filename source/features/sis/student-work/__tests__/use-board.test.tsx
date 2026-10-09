import * as React from 'react'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider, useQueryClient} from '@tanstack/react-query'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {keys, postingUnitsOptions, type PostingUnits} from '@frogpond/ccc-jobs'
import {setManifestServer} from '@frogpond/data-sources'
import {installCampusFixtures} from '../../../campus/fixtures'
import {useCampusStore} from '../../../campus/store'
import {queryClient as appQueryClient} from '../../../../init/tanstack-query'
import {useStudentWorkBoard} from '../use-board'

let client = new QueryClient()

// Wiki Monkeys' board, whose fixtures answer: the Treeline Commons Server (30103) is in
// Dining, and the Undergraduate Research Assistant (30101) its first in Research.
beforeEach(() => {
	useCampusStore.setState({campus: 'example.college'})
	setManifestServer('edu.stolaf')
	registerCampusServer('edu.stolaf', new URL('https://stolaf.example.invalid/'))
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
	client = new QueryClient()
})

// A client's garbage-collection timers would keep Jest from exiting.
afterEach(() => {
	client.clear()
	// The manifest is cached on the app's own client, whose collection timer would hold Jest open.
	appQueryClient.clear()
	setFetchInterceptor(null)
	jest.restoreAllMocks()
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
			expect(result.current.context.membership.get('dining')?.ids).toContain('30103'),
		)
	})

	test('files a posting the map lacks in no area, and reads no details', async () => {
		let units = await client.query(postingUnitsOptions)
		let {'30103': _dining, ...withoutDining} = units
		client.setQueryData<PostingUnits>(keys.postingUnits, withoutDining)

		let {result} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})

		await waitFor(() => expect(result.current.availability).toBe('ready'))
		await waitFor(() => expect(result.current.jobs.length).toBeGreaterThan(0))
		expect(result.current.context.membership.get('dining')?.ids).not.toContain('30103')
		expect(result.current.context.membership.get('research')?.ids).toContain('30101')
		expect(client.getQueryCache().findAll({queryKey: ['jobs', 'detail']})).toEqual([])
	})

	test('with no map and nothing saved, knows no areas', async () => {
		client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		jest.spyOn(postingUnitsOptions, 'queryFn').mockRejectedValue(new Error('ccc-server is down'))

		let {result} = await renderHook(() => useStudentWorkBoard(), {wrapper: Wrapper})

		await waitFor(() => expect(result.current.availability).toBe('unavailable'))
		expect(result.current.context.membership.size).toBe(0)
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
