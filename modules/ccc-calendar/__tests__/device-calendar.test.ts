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
	// `deviceCalendarOptions` asks for one calendar at a time, so an unnarrowed
	// read would mean a full-device EventKit sweep per enabled calendar.
	test('reads only the calendars it is given, and every one when given none', async () => {
		let start = new Date('2026-08-01')
		let end = new Date('2026-09-01')

		await listDeviceEvents(start, end, ['cal-2'])

		expect(mockListEvents).toHaveBeenCalledWith([{id: 'cal-2', title: 'Birthdays'}], start, end)

		await listDeviceEvents(start, end)

		expect(mockListEvents).toHaveBeenLastCalledWith(
			[
				{id: 'cal-1', title: 'Classes'},
				{id: 'cal-2', title: 'Birthdays'},
			],
			start,
			end,
		)
	})
})
