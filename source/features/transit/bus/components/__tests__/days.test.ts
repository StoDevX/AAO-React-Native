import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'

import {createMomentForDay, momentToDayOfWeek} from '../days'

const CENTRAL_TZ = 'America/Chicago'

/** 2019-12-18 was a Wednesday. */
const wednesday = () => moment.tz('2019-12-18T14:30:00', CENTRAL_TZ)

describe('momentToDayOfWeek', () => {
	test('names the day a moment falls on', () => {
		expect(momentToDayOfWeek(wednesday())).toBe('We')
	})

	test('covers every day of the week', () => {
		let week = Array.from({length: 7}, (_, offset) =>
			momentToDayOfWeek(moment.tz('2019-12-15T12:00:00', CENTRAL_TZ).add(offset, 'days')),
		)

		expect(week).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])
	})
})

describe('createMomentForDay', () => {
	test('moves forward to a later day in the same week', () => {
		expect(createMomentForDay(wednesday(), 'Sa').format('YYYY-MM-DD')).toBe('2019-12-21')
	})

	test('moves backward to an earlier day in the same week', () => {
		// The week runs Sunday to Saturday, so asking a Wednesday for Sunday
		// goes back three days rather than forward four.
		expect(createMomentForDay(wednesday(), 'Su').format('YYYY-MM-DD')).toBe('2019-12-15')
	})

	test('stays put when the target is the day it is already on', () => {
		expect(createMomentForDay(wednesday(), 'We').format('YYYY-MM-DD')).toBe('2019-12-18')
	})

	test('keeps the time of day, which the schedules are read against', () => {
		expect(createMomentForDay(wednesday(), 'Fr').format('HH:mm')).toBe('14:30')
	})

	test('leaves its argument alone', () => {
		// Both bus screens pass the same ticking moment, so a mutation here
		// would move the clock out from under the other one.
		let base = wednesday()
		createMomentForDay(base, 'Sa')

		expect(base.format('YYYY-MM-DD')).toBe('2019-12-18')
	})
})
