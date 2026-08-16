import {describe, expect, test} from '@jest/globals'

import {reducer, toggleCalendarSource} from '../settings'

function initial() {
	return reducer(undefined, {type: '@@INIT'})
}

describe('calendar source selection', () => {
	// A fresh install lands on St. Olaf today; defaulting both on would change
	// what every existing user sees on first launch.
	test('starts with St. Olaf alone', () => {
		expect(initial().enabledCalendarSources).toEqual(['stolaf'])
	})

	test('toggling adds a source', () => {
		let state = reducer(initial(), toggleCalendarSource('northfield'))

		expect(state.enabledCalendarSources).toEqual(['stolaf', 'northfield'])
	})

	test('toggling again removes it', () => {
		let state = reducer(initial(), toggleCalendarSource('northfield'))
		state = reducer(state, toggleCalendarSource('northfield'))

		expect(state.enabledCalendarSources).toEqual(['stolaf'])
	})

	// Turning everything off is a state the list handles, not one to prevent.
	test('the last source can be turned off', () => {
		let state = reducer(initial(), toggleCalendarSource('stolaf'))

		expect(state.enabledCalendarSources).toEqual([])
	})
})
