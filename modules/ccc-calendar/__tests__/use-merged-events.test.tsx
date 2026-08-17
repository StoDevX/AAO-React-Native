import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import moment from 'moment-timezone'

import type {CalendarSource} from '../sources'
import {useMergedEvents} from '../use-merged-events'

// Named with a `mock` prefix so `babel-plugin-jest-hoist` allows the
// hoisted `jest.mock()` factory below to reference it.
function mockMakeEvent(title: string) {
	return {
		title,
		description: '',
		location: '',
		startTime: moment('2026-08-17T09:00:00'),
		endTime: moment('2026-08-17T10:00:00'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location' as const},
	}
}

// The queries tag their own results, so the mocks return what a `select` would.
jest.mock('../query', () => ({
	namedCalendarOptions: (name: string) => ({
		queryKey: ['calendar', name],
		queryFn: () => {
			if (name === 'northfield') throw new Error('down')
			return [{sourceId: name, key: 'olaf-1', event: mockMakeEvent('Olaf event')}]
		},
	}),
	deviceCalendarOptions: (calendarId: string) => ({
		queryKey: ['calendar', 'device', calendarId],
		queryFn: () => [
			{sourceId: `device:${calendarId}`, key: 'evt-1', event: mockMakeEvent('Device event')},
		],
	}),
}))

const STOLAF: CalendarSource = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote'}
const NORTHFIELD: CalendarSource = {
	id: 'northfield',
	title: 'Northfield',
	color: 'indigo',
	kind: 'remote',
}
const DEVICE_CAL_1: CalendarSource = {
	id: 'device:cal-1',
	title: 'Birthdays',
	color: '#34C759',
	kind: 'device',
}

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
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useMergedEvents', () => {
	test('events from every enabled source arrive together, tagged with it', async () => {
		let {result} = await renderHook(() => useMergedEvents([STOLAF]), {wrapper})

		await waitFor(() => expect(result.current.events).toHaveLength(1))
		expect(result.current.events[0]?.sourceId).toBe('stolaf')
	})

	// One failing feed must not blank the screen: with several sources, a flaky
	// one would take the working ones down with it.
	test('a failing source is named without hiding the ones that loaded', async () => {
		let {result} = await renderHook(() => useMergedEvents([STOLAF, NORTHFIELD]), {wrapper})

		await waitFor(() => expect(result.current.failed).toHaveLength(1))
		expect(result.current.failed[0]?.id).toBe('northfield')
		expect(result.current.events).toHaveLength(1)
	})

	test('no sources means no events and no failures', async () => {
		let {result} = await renderHook(() => useMergedEvents([]), {wrapper})

		expect(result.current.events).toEqual([])
		expect(result.current.failed).toEqual([])
	})

	// `isDeviceSourceId`/`deviceCalendarIdFrom` route a device source to
	// `deviceCalendarOptions` instead of `namedCalendarOptions` -- the only
	// branch in the hook, and otherwise untested.
	test('a device source is routed to deviceCalendarOptions, tagged with its own id', async () => {
		let {result} = await renderHook(() => useMergedEvents([DEVICE_CAL_1]), {wrapper})

		await waitFor(() => expect(result.current.events).toHaveLength(1))
		expect(result.current.events[0]?.sourceId).toBe('device:cal-1')
		expect(result.current.failed).toEqual([])
	})
})
