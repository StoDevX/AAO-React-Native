import {describe, expect, test} from '@jest/globals'

import {
	deviceCalendarIdFrom,
	deviceSourceId,
	isDeviceSourceId,
	REMOTE_SOURCES,
	toDeviceSource,
} from '../sources'

describe('calendar sources', () => {
	test('the app ships two remote sources', () => {
		expect(REMOTE_SOURCES.map((s) => s.id)).toEqual(['stolaf', 'northfield'])
		expect(REMOTE_SOURCES.every((s) => s.kind === 'remote')).toBe(true)
	})

	test('the two remote sources are told apart by colour', () => {
		let [stolaf, northfield] = REMOTE_SOURCES
		expect(stolaf.color).not.toBe(northfield.color)
	})

	// EventKit's colour is a choice the user already made in Calendar.app, so a
	// device source carries it rather than being assigned one of ours.
	test('a device calendar keeps its own colour', () => {
		let source = toDeviceSource({id: 'ABC123', title: 'Birthdays', color: '#34C759'})

		expect(source).toEqual({
			id: 'device:ABC123',
			title: 'Birthdays',
			color: '#34C759',
			kind: 'device',
		})
	})

	test('a device source id round-trips to its calendar id', () => {
		let id = deviceSourceId('ABC123')

		expect(isDeviceSourceId(id)).toBe(true)
		expect(deviceCalendarIdFrom(id)).toBe('ABC123')
	})

	test('a remote id is not a device id', () => {
		expect(isDeviceSourceId('stolaf')).toBe(false)
	})
})
