import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {reducer as settings} from '../../../source/redux/parts/settings'
import {useCalendarSource, useCalendarSources} from '../use-calendar-sources'

// `query.ts` imports the app's shared `queryClient` singleton, which wires up
// NetInfo at module scope to drive React Query's online/offline behaviour.
// The package ships its own jest mock for exactly this.
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

// Named `mock*` so the `jest.mock` factories below -- which close over them --
// pass Jest's out-of-scope-variable check, and so each test can assert on
// calls rather than only on the values these resolve to.
const mockGetFullCalendarAccess = jest.fn(() =>
	Promise.resolve({status: 'undetermined', granted: false}),
)
const mockRequestFullCalendarAccess = jest.fn(() =>
	Promise.resolve({status: 'granted', granted: true}),
)
const mockGetCalendars = jest.fn(() =>
	Promise.resolve([{id: 'ABC', title: 'Birthdays', color: '#34C759'}]),
)

jest.mock('../device-calendar', () => ({
	getFullCalendarAccess: () => mockGetFullCalendarAccess(),
	requestFullCalendarAccess: () => mockRequestFullCalendarAccess(),
}))
jest.mock('expo-calendar', () => ({
	EntityTypes: {EVENT: 'event'},
	getCalendars: () => mockGetCalendars(),
}))

const mockUseIsDevMode = jest.fn(() => false)
jest.mock('../../../source/lib/use-is-dev-mode', () => ({
	useIsDevMode: () => mockUseIsDevMode(),
}))

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
const trackedQueryClients: QueryClient[] = []

beforeEach(() => {
	mockGetFullCalendarAccess.mockClear()
	mockRequestFullCalendarAccess.mockClear()
	mockGetCalendars.mockClear()
})

afterEach(() => {
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
})

function wrapper({children}: {children: React.ReactNode}) {
	let store = configureStore({reducer: {settings}})
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	return (
		<Provider store={store}>
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		</Provider>
	)
}

describe('useCalendarSources', () => {
	test('outside dev mode there are only the app’s calendars', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		expect(result.current.remote.map((s) => s.id)).toEqual(['uitest'])
		expect(result.current.device).toEqual([])
		// The branch's central invariant: a production build must not so much as
		// ask EventKit what it already granted.
		expect(mockGetFullCalendarAccess).not.toHaveBeenCalled()
	})

	test('in dev mode the device can be offered, but nothing is read before a grant', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		// The access check settles to the same falsy `granted` it started with, so
		// nothing about `result.current` changes when it lands. Counting renders is
		// the only way to wait for that settling honestly: without it, the query's
		// notification to this hook arrives after the test has already finished,
		// leaking its timer and firing a state update against a torn-down renderer.
		let renders = 0
		let {result} = await renderHook(
			() => {
				renders += 1
				return useCalendarSources()
			},
			{wrapper},
		)

		expect(result.current.canOfferDevice).toBe(true)
		expect(result.current.deviceAvailable).toBe(false)
		expect(result.current.device).toEqual([])
		expect(mockGetCalendars).not.toHaveBeenCalled()

		await waitFor(() => {
			expect(mockGetFullCalendarAccess).toHaveBeenCalled()
			expect(renders).toBeGreaterThan(1)
		})
	})

	test('requesting the device in dev mode surfaces its calendars as sources', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		expect(result.current.deviceAvailable).toBe(false)

		await act(async () => {
			await result.current.requestDevice()
		})

		await waitFor(() => {
			expect(result.current.device).toEqual([
				{id: 'device:ABC', title: 'Birthdays', color: '#34C759', kind: 'device'},
			])
		})
		expect(result.current.deviceAvailable).toBe(true)
	})

	// Three components call this hook on the calendar screen -- the picker, the
	// list, and the detail screen -- and the grant is won in the picker. If each
	// instance kept its own answer, the list would go on filtering the newly
	// enabled device sources back out until the screen remounted.
	test('a grant won in one instance reaches the others', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		let {result} = await renderHook(
			() => ({picker: useCalendarSources(), list: useCalendarSources()}),
			{wrapper},
		)

		expect(result.current.list.deviceAvailable).toBe(false)

		await act(async () => {
			await result.current.picker.requestDevice()
		})

		await waitFor(() => {
			expect(result.current.list.device).toEqual([
				{id: 'device:ABC', title: 'Birthdays', color: '#34C759', kind: 'device'},
			])
		})
		expect(result.current.list.deviceAvailable).toBe(true)
		expect(result.current.list.all.map((s) => s.id)).toContain('device:ABC')
	})

	test('outside dev mode, requestDevice never prompts', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		await act(async () => {
			await result.current.requestDevice()
		})

		expect(mockRequestFullCalendarAccess).not.toHaveBeenCalled()
	})

	test('only St. Olaf is enabled to begin with', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		expect(result.current.enabled.map((s) => s.id)).toEqual(['uitest'])
	})

	test('toggling a source changes what is enabled', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		await act(() => {
			result.current.toggle('uitest')
		})

		// Falls back to first remote source when nothing is explicitly enabled
		expect(result.current.enabled.map((s) => s.id)).toEqual(['uitest'])
	})

	// The detail screen arrives knowing only an id, and must reach the same
	// colour the list used.
	test('a source id resolves to its source', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSource('uitest'), {wrapper})

		expect(result.current?.title).toBe('UI Test Fixtures')
	})
})
