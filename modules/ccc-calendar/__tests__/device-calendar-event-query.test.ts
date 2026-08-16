import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'
import type {QueryFunction} from '@tanstack/react-query'

import {deviceCalendarEventOptions} from '../query'

// Named `mock*` so the hoisted `jest.mock` factory may close over it.
const mockEvent = {
	title: 'Chapel',
	description: '',
	location: 'Boe Chapel',
	startTime: moment('2026-08-17T09:00:00'),
	endTime: moment('2026-08-17T10:00:00'),
	isOngoing: false,
	links: [],
	config: {startTime: true, endTime: true, subtitle: 'location' as const},
}

const mockListDeviceEvents =
	jest.fn<(start: Date, end: Date, calendarIds?: string[]) => Promise<unknown[]>>()

jest.mock('../device-calendar', () => ({
	listDeviceEvents: (start: Date, end: Date, calendarIds?: string[]) =>
		mockListDeviceEvents(start, end, calendarIds),
}))

// `query.ts` also carries the remote calendars, whose imports reach
// expo-modules-core's native bindings (absent under Jest). None of them is on
// the device-event path this file exercises.
jest.mock('expo-calendar', () => ({EntityTypes: {EVENT: 'event'}}))
jest.mock('@frogpond/data-sources', () => ({
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
	resolveSource: jest.fn(),
	REL_CALENDAR: 'calendar',
}))
jest.mock('../../../source/init/tanstack-query', () => ({queryClient: {}}))

/// `queryOptions` types `queryFn` as React Query's `QueryFunction`, which takes
/// a context argument. This query never reads one, so the tests call it with a
/// stand-in rather than assembling a whole `QueryFunctionContext`.
function runQueryFn<T>(options: {queryFn?: QueryFunction<T, never, never>}): Promise<T> {
	if (typeof options.queryFn !== 'function') {
		throw new Error('these options carry no queryFn')
	}
	return Promise.resolve(options.queryFn(undefined as never))
}

beforeEach(() => {
	mockListDeviceEvents.mockClear()
})

describe('deviceCalendarEventOptions', () => {
	test('it finds the event with the matching EventKit id', async () => {
		mockListDeviceEvents.mockResolvedValue([
			{calendarId: 'cal-1', id: 'evt-1', event: {...mockEvent, title: 'Other'}},
			{calendarId: 'cal-1', id: 'evt-2', event: mockEvent},
		])

		let options = deviceCalendarEventOptions('cal-1', 'evt-2')
		let event = await runQueryFn(options)

		expect(event).toBe(mockEvent)
	})

	test('it reads only the named calendar, a month either side of today', async () => {
		mockListDeviceEvents.mockResolvedValue([])

		await runQueryFn(deviceCalendarEventOptions('cal-1', 'evt-1'))

		expect(mockListDeviceEvents).toHaveBeenCalledTimes(1)
		let [start, end, calendarIds] = mockListDeviceEvents.mock.calls[0] ?? []
		expect(calendarIds).toEqual(['cal-1'])
		expect(moment(start).format('YYYY-MM-DD')).toBe(
			moment().startOf('day').subtract(1, 'month').format('YYYY-MM-DD'),
		)
		expect(moment(end).format('YYYY-MM-DD')).toBe(
			moment().startOf('day').add(1, 'month').format('YYYY-MM-DD'),
		)
	})

	test('it resolves undefined when nothing carries that id', async () => {
		mockListDeviceEvents.mockResolvedValue([{calendarId: 'cal-1', id: 'evt-1', event: mockEvent}])

		let event = await runQueryFn(deviceCalendarEventOptions('cal-1', 'gone'))

		expect(event).toBeUndefined()
	})

	test('its key is distinct per event, under the calendar it belongs to', () => {
		expect(deviceCalendarEventOptions('cal-1', 'evt-2').queryKey).toEqual([
			'calendar',
			'device',
			'cal-1',
			'evt-2',
		])
	})
})
