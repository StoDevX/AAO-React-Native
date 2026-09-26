import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import {findClosure} from '../find-closure'
import type {BusSchedule} from '../../types'

const CENTRAL_TZ = 'America/Chicago'

/** A minimal processed schedule, valid unless a caller overrides fields. */
function schedule(overrides: Partial<BusSchedule> = {}): BusSchedule {
	return {
		days: ['Mo'],
		timetable: [],
		stops: [],
		coordinates: {},
		times: [],
		...overrides,
	}
}

describe('findClosure', () => {
	test('returns the closure whose date matches today', () => {
		let now = moment.tz('2026-09-07T08:00:00', CENTRAL_TZ)
		let schedules = [schedule({closures: [{date: '2026-09-07', name: 'Labor Day'}]})]

		expect(findClosure(schedules, now)).toEqual({date: '2026-09-07', name: 'Labor Day'})
	})

	test('returns null when no closure matches today', () => {
		let now = moment.tz('2026-09-08T08:00:00', CENTRAL_TZ)
		let schedules = [schedule({closures: [{date: '2026-09-07', name: 'Labor Day'}]})]

		expect(findClosure(schedules, now)).toBeNull()
	})

	test('returns null for a schedule with no closures at all', () => {
		let now = moment.tz('2026-09-07T08:00:00', CENTRAL_TZ)
		let schedules = [schedule()]

		expect(findClosure(schedules, now)).toBeNull()
	})

	test('counts the closure date itself as closed, not the day before or after', () => {
		let closures = [{date: '2026-09-07', name: 'Labor Day'}]
		let schedules = [schedule({closures})]

		let dayBefore = moment.tz('2026-09-06T23:59:00', CENTRAL_TZ)
		let theDay = moment.tz('2026-09-07T00:00:01', CENTRAL_TZ)
		let dayAfter = moment.tz('2026-09-08T00:00:01', CENTRAL_TZ)

		expect(findClosure(schedules, dayBefore)).toBeNull()
		expect(findClosure(schedules, theDay)).toEqual(closures[0])
		expect(findClosure(schedules, dayAfter)).toBeNull()
	})
})
