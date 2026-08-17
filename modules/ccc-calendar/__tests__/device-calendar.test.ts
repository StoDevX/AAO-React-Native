import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {type DeviceEventFields, listDeviceEvents, toEventType} from '../device-calendar'

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

function makeDeviceEvent(overrides: Partial<DeviceEventFields> = {}): DeviceEventFields {
	return {
		title: 'Chapel',
		location: 'Boe Memorial Chapel',
		notes: 'Bring a hymnal',
		url: 'https://wp.stolaf.edu/chapel/',
		startDate: new Date('2026-08-17T15:20:00.000Z'),
		endDate: new Date('2026-08-17T15:40:00.000Z'),
		allDay: false,
		...overrides,
	}
}

describe('toEventType', () => {
	test('carries EventKit’s fields over to the ones the event views read', () => {
		let event = toEventType(makeDeviceEvent())

		expect(event.title).toBe('Chapel')
		expect(event.location).toBe('Boe Memorial Chapel')
		expect(event.description).toBe('Bring a hymnal')
		expect(event.links).toEqual(['https://wp.stolaf.edu/chapel/'])
		expect(event.startTime.toISOString()).toBe('2026-08-17T15:20:00.000Z')
		expect(event.endTime.toISOString()).toBe('2026-08-17T15:40:00.000Z')
		expect(event.config.subtitle).toBe('location')
	})

	// Only a calendar the app fetches itself can say an event is happening now;
	// EventKit reports no such thing.
	test('never marks a device event as ongoing', () => {
		expect(toEventType(makeDeviceEvent()).isOngoing).toBe(false)
	})

	test('a timed event’s edges both carry a meaningful time', () => {
		let event = toEventType(makeDeviceEvent({allDay: false}))

		expect(event.config.startTime).toBe(true)
		expect(event.config.endTime).toBe(true)
	})

	// EventKit spans an all-day event 00:00:00 to 23:59:59, so an event whose
	// edges were treated as meaningful would read "12 AM to 11:59 PM" on the
	// detail screen instead of "all-day".
	test('an all-day event’s edges carry no meaningful time', () => {
		let event = toEventType(
			makeDeviceEvent({
				allDay: true,
				startDate: new Date('2026-08-17T05:00:00.000Z'),
				endDate: new Date('2026-08-18T04:59:59.000Z'),
			}),
		)

		expect(event.config.startTime).toBe(false)
		expect(event.config.endTime).toBe(false)
	})

	// `EventType` types these three as strings and an array; an event with none
	// of them must still satisfy that rather than handing the views a null.
	test('an event with no location, notes, or url gets empty ones', () => {
		let event = toEventType(makeDeviceEvent({location: null, notes: '', url: undefined}))

		expect(event.location).toBe('')
		expect(event.description).toBe('')
		expect(event.links).toEqual([])
	})
})
