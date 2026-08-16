import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
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

jest.mock('../device-calendar', () => ({
	getFullCalendarAccess: jest.fn(() => Promise.resolve({status: 'undetermined', granted: false})),
	requestFullCalendarAccess: jest.fn(() => Promise.resolve({status: 'granted', granted: true})),
}))
jest.mock('expo-calendar', () => ({
	EntityTypes: {EVENT: 'event'},
	getCalendars: jest.fn(() => Promise.resolve([{id: 'ABC', title: 'Birthdays', color: '#34C759'}])),
}))

const mockUseIsDevMode = jest.fn(() => false)
jest.mock('../../../source/lib/use-is-dev-mode', () => ({
	useIsDevMode: () => mockUseIsDevMode(),
}))

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
const trackedQueryClients: QueryClient[] = []

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

		expect(result.current.remote.map((s) => s.id)).toEqual(['stolaf', 'northfield'])
		expect(result.current.canOfferDevice).toBe(false)
		expect(result.current.device).toEqual([])
	})

	test('in dev mode the device can be offered, but nothing is read before a grant', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		expect(result.current.canOfferDevice).toBe(true)
		expect(result.current.deviceAvailable).toBe(false)
		expect(result.current.device).toEqual([])
	})

	test('only St. Olaf is enabled to begin with', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		expect(result.current.enabled.map((s) => s.id)).toEqual(['stolaf'])
	})

	test('toggling a source changes what is enabled', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSources(), {wrapper})

		await act(() => {
			result.current.toggle('northfield')
		})

		expect(result.current.enabled.map((s) => s.id)).toEqual(['stolaf', 'northfield'])
	})

	// The detail screen arrives knowing only an id, and must reach the same
	// colour the list used.
	test('a source id resolves to its source', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		let {result} = await renderHook(() => useCalendarSource('northfield'), {wrapper})

		expect(result.current?.title).toBe('Northfield')
		expect(result.current?.color).toBeDefined()
	})
})
