import {describe, expect, test} from '@jest/globals'

import {calendarView, needsPresence, PRESENCE_SOURCE} from '../scope'

const SAVED = {filter: {axis: 'category', value: 'Music'}, mode: 'day'} as const

describe('calendarView', () => {
	test('the calendar itself draws from the saved settings, and can change them', () => {
		expect(calendarView(SAVED, undefined)).toEqual({...SAVED, adjustable: true})
	})

	test("one organization's calendar narrows to it, in the Upcoming list", () => {
		expect(calendarView(SAVED, 'Agape')).toEqual({
			filter: {axis: 'organization', value: 'Agape'},
			mode: 'upcoming',
			adjustable: false,
		})
	})

	test("one organization's calendar leaves the saved settings as they were", () => {
		let saved = {filter: null, mode: 'day' as const}
		calendarView(saved, 'Agape')
		expect(saved).toEqual({filter: null, mode: 'day'})
	})
})

describe('needsPresence', () => {
	test("one organization's calendar turns Presence on when it is off", () => {
		expect(needsPresence('Agape', ['stolaf'])).toBe(true)
	})

	test('nothing changes when Presence is already on', () => {
		expect(needsPresence('Agape', ['stolaf', PRESENCE_SOURCE])).toBe(false)
	})

	test('the calendar itself never turns a source on', () => {
		expect(needsPresence(undefined, ['stolaf'])).toBe(false)
	})
})
