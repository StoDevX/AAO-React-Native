import {describe, expect, test} from '@jest/globals'

import {scheduleNote, scheduleStatus} from '../player-view/schedule-note'

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

describe('scheduleStatus', () => {
	test('is ready once there is data, even if a refetch failed or is paused', () => {
		expect(scheduleStatus({hasData: true, isError: true, fetchStatus: 'idle'})).toBe('ready')
		expect(scheduleStatus({hasData: true, isError: false, fetchStatus: 'paused'})).toBe('ready')
	})

	test('is loading while the first fetch is under way', () => {
		expect(scheduleStatus({hasData: false, isError: false, fetchStatus: 'fetching'})).toBe(
			'loading',
		)
	})

	test('is an error when the first fetch failed', () => {
		expect(scheduleStatus({hasData: false, isError: true, fetchStatus: 'idle'})).toBe('error')
	})

	test('is an error while offline with nothing cached, as a paused fetch never settles', () => {
		expect(scheduleStatus({hasData: false, isError: false, fetchStatus: 'paused'})).toBe('error')
	})
})
