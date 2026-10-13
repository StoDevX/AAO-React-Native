import {describe, expect, test} from '@jest/globals'

import {HIDDEN_FROM_CALENDAR} from '../constants'
import {calendarView, PRESENCE_SOURCE} from '../scope'

const SAVED = {filter: {axis: 'category', value: 'Music'}, mode: 'day'} as const

describe('calendarView', () => {
	test('the calendar itself draws from the saved settings and the calendars the reader turned on', () => {
		expect(calendarView(SAVED, undefined)).toEqual({
			...SAVED,
			adjustable: true,
			sourceIds: null,
			exclude: HIDDEN_FROM_CALENDAR,
		})
	})

	test("one organization's calendar narrows to it, in the Upcoming list", () => {
		let view = calendarView(SAVED, 'Agape')
		expect(view.filter).toEqual({axis: 'organization', value: 'Agape'})
		expect(view.mode).toBe('upcoming')
		expect(view.adjustable).toBe(false)
	})

	test("one organization's calendar reads Presence, whichever calendars the reader turned on", () => {
		expect(calendarView(SAVED, 'Agape').sourceIds).toEqual([PRESENCE_SOURCE])
	})

	test("one organization's calendar hides none of its events, even an organization the calendar hides", () => {
		let hidden = HIDDEN_FROM_CALENDAR.find((selection) => selection.axis === 'organization')
		expect(hidden).toBeDefined()
		expect(calendarView(SAVED, hidden?.value ?? '').exclude).toEqual([])
	})

	test("one organization's calendar leaves the saved settings as they were", () => {
		let saved = {filter: null, mode: 'day' as const}
		calendarView(saved, 'Agape')
		expect(saved).toEqual({filter: null, mode: 'day'})
	})
})
