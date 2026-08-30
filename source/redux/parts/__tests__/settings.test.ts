import {describe, expect, test} from '@jest/globals'

import {reducer, selectEnabledCalendarSources, toggleCalendarSource} from '../settings'
import type {RootState} from '../../store'

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

	// redux-persist's default reconciler (autoMergeLevel1) swaps the whole
	// `settings` slice in from storage rather than merging field-by-field, so
	// an install that persisted `settings` before this field existed
	// rehydrates to exactly this shape -- not a hand-built stand-in for it.
	describe('rehydrating settings persisted before this field existed', () => {
		const staleRehydratedState = {
			unofficialityAcknowledged: true,
			devModeOverride: false,
		} as ReturnType<typeof reducer>

		test('the selector falls back to St. Olaf alone', () => {
			let rootState = {settings: staleRehydratedState} as RootState

			expect(selectEnabledCalendarSources(rootState)).toEqual(['stolaf'])
		})

		test('toggling does not throw, and starts from St. Olaf alone', () => {
			expect(() => reducer(staleRehydratedState, toggleCalendarSource('northfield'))).not.toThrow()

			let state = reducer(staleRehydratedState, toggleCalendarSource('northfield'))

			expect(state.enabledCalendarSources).toEqual(['stolaf', 'northfield'])
		})
	})
})
