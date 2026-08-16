import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {listDeviceEvents} from '../device-calendar'

// Named `mock*` so the `jest.mock` factory below -- which closes over it --
// passes Jest's out-of-scope-variable check.
const mockGetCalendars = jest.fn(() =>
	Promise.resolve([
		{id: 'cal-1', title: 'Classes'},
		{id: 'cal-2', title: 'Birthdays'},
	]),
)
const mockListEvents = jest.fn((_calendars: unknown, _start: unknown, _end: unknown) =>
	Promise.resolve([]),
)

jest.mock('expo-calendar', () => ({
	EntityTypes: {EVENT: 'event'},
	getCalendars: () => mockGetCalendars(),
	listEvents: (calendars: unknown, start: unknown, end: unknown) =>
		mockListEvents(calendars, start, end),
}))

beforeEach(() => {
	mockGetCalendars.mockClear()
	mockListEvents.mockClear()
})

describe('listDeviceEvents', () => {
	test('with no calendar ids given, reads every calendar on the device', async () => {
		let start = new Date('2026-08-01')
		let end = new Date('2026-09-01')

		await listDeviceEvents(start, end)

		expect(mockListEvents).toHaveBeenCalledWith(
			[
				{id: 'cal-1', title: 'Classes'},
				{id: 'cal-2', title: 'Birthdays'},
			],
			start,
			end,
		)
	})

	// This is what `deviceCalendarOptions` relies on: one enabled device
	// source should mean one calendar's worth of EventKit reading, not a
	// full-device sweep filtered down afterward.
	test('with calendar ids given, narrows the EventKit read to just those calendars', async () => {
		let start = new Date('2026-08-01')
		let end = new Date('2026-09-01')

		await listDeviceEvents(start, end, ['cal-2'])

		expect(mockListEvents).toHaveBeenCalledWith([{id: 'cal-2', title: 'Birthdays'}], start, end)
	})
})
