import {describe, expect, test} from '@jest/globals'

import type {BonAppCafeDay} from '../../types'
import {daypartHours} from '../daypart-hours'
import {plainMoment} from '../../../building-hours/lib/__tests__/moment.helper'

/** A day as Bon Appétit publishes it, holding the given dayparts. */
function day(date: string, ...dayparts: Array<[string, string, string]>): BonAppCafeDay {
	return {
		date,
		dayparts: dayparts.map(([label, starttime, endtime], i) => ({
			id: String(i),
			label,
			starttime,
			endtime,
			message: '',
		})),
		status: '',
		message: false,
	}
}

/** The Cage as Bon Appétit publishes it: one daypart, named after the cafe. */
const CAGE = [day('2026-09-22', ['The Cage', '07:30', '20:00'])]

const at = (stamp: string) => plainMoment(stamp, 'YYYY-MM-DD HH:mm')

describe('daypartHours', () => {
	describe('a cafe with one daypart today', () => {
		test('says when it opens, before it does', () => {
			expect(daypartHours(CAGE, at('2026-09-22 06:00'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Opens at 7:30 AM',
			})
		})

		test('says when it closes, while it is open', () => {
			expect(daypartHours(CAGE, at('2026-09-22 12:00'))).toEqual({
				time: 'Closes at 8 PM',
				closed: false,
				reopening: null,
			})
		})

		// Bon Appétit publishes one day at a time, so there is no tomorrow to look
		// for, and a cafe that served today may not serve tomorrow -- the day
		// before a break, or a Friday at a cafe shut on weekends. `Closed` is the
		// one line that is true either way.
		test('says only that it is closed, after it closes', () => {
			expect(daypartHours(CAGE, at('2026-09-22 21:00'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Closed',
			})
		})

		// Sayles' Late Night runs past midnight, so its close is the next day's.
		test('says when a daypart past midnight closes', () => {
			let lateNight = [day('2026-09-22', ['Late Night', '22:00', '01:00'])]
			expect(daypartHours(lateNight, at('2026-09-22 23:00'))).toEqual({
				time: 'Closes at 1 AM',
				closed: false,
				reopening: null,
			})
		})

		// BonApp pads its hours ("07:30"); a daypart it did not pad parses the
		// same.
		test('reads an hour written without its padding', () => {
			let unpadded = [day('2026-09-22', ['The Cage', '7:30', '20:00'])]
			expect(daypartHours(unpadded, at('2026-09-22 06:00'))?.reopening).toBe('Opens at 7:30 AM')
		})
	})

	// Each of these keeps the header's window-by-window line.
	describe('says nothing for', () => {
		test('a cafe with several dayparts today', () => {
			let stav = [
				day(
					'2026-09-22',
					['Breakfast', '07:15', '09:45'],
					['Lunch', '10:30', '14:00'],
					['Dinner', '16:30', '20:00'],
				),
			]
			expect(daypartHours(stav, at('2026-09-22 12:00'))).toBeNull()
		})

		// A cached response can outlive the day it describes, and another day's
		// hours say nothing about whether the cafe is open now.
		test('a day that is not today', () => {
			let yesterday = [day('2026-09-21', ['The Cage', '07:30', '20:00'])]
			expect(daypartHours(yesterday, at('2026-09-22 00:30'))).toBeNull()
		})

		// BonApp shuts a cafe by publishing a daypart labelled `Closed`, which
		// is not a window the cafe serves in.
		test('a cafe whose one daypart says it is closed', () => {
			let closed = [day('2026-09-22', ['Closed', '00:00', '24:00'])]
			expect(daypartHours(closed, at('2026-09-22 12:00'))).toBeNull()
		})

		// BonApp writes a whole day, or no time at all, for a daypart whose times
		// say nothing; the meal's own window drops those too.
		test('a daypart covering the whole day', () => {
			let allDay = [day('2026-09-22', ['All Day', '00:00', '23:59'])]
			expect(daypartHours(allDay, at('2026-09-22 12:00'))).toBeNull()
			let untilMidnight = [day('2026-09-22', ['Menu', '00:00', '24:00'])]
			expect(daypartHours(untilMidnight, at('2026-09-22 12:00'))).toBeNull()
		})

		test('a daypart with no length', () => {
			let empty = [day('2026-09-22', ['Menu', '00:00', '00:00'])]
			expect(daypartHours(empty, at('2026-09-22 12:00'))).toBeNull()
		})

		// Only today is published, so after midnight last night's Late Night is
		// not in the data, and today's has not started. Whether the cafe is open
		// right now is not something the day can answer.
		test('the small hours of a daypart that runs past midnight', () => {
			let lateNight = [day('2026-09-22', ['Late Night', '22:00', '01:00'])]
			expect(daypartHours(lateNight, at('2026-09-22 00:30'))).toBeNull()
		})

		// The cafe query resolves after the screen first draws.
		test('a cafe that has not arrived', () => {
			expect(daypartHours(undefined, at('2026-09-22 12:00'))).toBeNull()
		})

		test('a daypart whose times do not parse', () => {
			let garbled = [day('2026-09-22', ['The Cage', 'soon', 'later'])]
			expect(daypartHours(garbled, at('2026-09-22 12:00'))).toBeNull()
		})
	})

	// The body of the screen reads the same flags to decide the cafe is shut,
	// so the line under its name agrees with it.
	describe('reports as shut', () => {
		test('a day Bon Appétit marks closed', () => {
			let closed = [{...day('2026-09-22', ['The Cage', '07:30', '20:00']), status: 'closed'}]
			expect(daypartHours(closed, at('2026-09-22 12:00'))).toEqual({
				time: null,
				closed: true,
				reopening: null,
			})
		})

		test('a day with no dayparts', () => {
			expect(daypartHours([day('2026-09-22')], at('2026-09-22 12:00'))).toEqual({
				time: null,
				closed: true,
				reopening: null,
			})
		})
	})
})
