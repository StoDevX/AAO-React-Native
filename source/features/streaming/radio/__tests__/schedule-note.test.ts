import {describe, expect, test} from '@jest/globals'

import {scheduleNote} from '../player-view/schedule-note'

describe('scheduleNote', () => {
	test('says the schedule is coming while it loads', () => {
		expect(scheduleNote('loading', 0)).toBe('Loading today’s schedule…')
	})

	test('says when the schedule could not load', () => {
		expect(scheduleNote('error', 0)).toBe('Couldn’t load the schedule')
	})

	test('says when nothing else is on today', () => {
		expect(scheduleNote('ready', 0)).toBe('Nothing else today')
	})

	test('says nothing over a list of shows', () => {
		expect(scheduleNote('ready', 3)).toBeNull()
	})
})
