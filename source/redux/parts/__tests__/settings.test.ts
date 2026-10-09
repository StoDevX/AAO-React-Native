import {describe, expect, test} from '@jest/globals'

import {
	reducer,
	selectDirectoryResultsView,
	selectEnabledCalendarSources,
	setDirectoryResultsView,
	toggleCalendarSource,
} from '../settings'
import type {RootState} from '../../store'

const DEFAULTS = ['stolaf', 'presence', 'carleton', 'wiki-monkeys']

function initial() {
	return reducer(undefined, {type: '@@INIT'})
}

describe('calendar source selection', () => {
	// Every campus's calendars, in UI tests too: a campus's fixtures answer
	// its own calendar like any other request.
	test('starts with the default list', () => {
		expect(initial().enabledCalendarSources).toEqual(DEFAULTS)
	})

	test('toggling adds a source', () => {
		let state = reducer(initial(), toggleCalendarSource('northfield'))

		expect(state.enabledCalendarSources).toEqual([...DEFAULTS, 'northfield'])
	})

	test('toggling again removes it', () => {
		let state = reducer(initial(), toggleCalendarSource('northfield'))
		state = reducer(state, toggleCalendarSource('northfield'))

		expect(state.enabledCalendarSources).toEqual(DEFAULTS)
	})

	// Turning everything off is a state the list handles, not one to prevent.
	test('the last source can be turned off', () => {
		let state = DEFAULTS.reduce(
			(current, id) => reducer(current, toggleCalendarSource(id)),
			initial(),
		)

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

		test('the selector falls back to the default list', () => {
			let rootState = {settings: staleRehydratedState} as RootState

			expect(selectEnabledCalendarSources(rootState)).toEqual(DEFAULTS)
		})

		test('toggling does not throw, and starts from the default list', () => {
			expect(() => reducer(staleRehydratedState, toggleCalendarSource('northfield'))).not.toThrow()

			let state = reducer(staleRehydratedState, toggleCalendarSource('northfield'))

			expect(state.enabledCalendarSources).toEqual([...DEFAULTS, 'northfield'])
		})
	})
})

describe('directory results view', () => {
	test('starts as the tile gallery', () => {
		expect(initial().directoryResultsView).toBe('tiles')
	})

	test('setting the view changes it', () => {
		let state = reducer(initial(), setDirectoryResultsView('list'))

		expect(state.directoryResultsView).toBe('list')
	})

	// autoMergeLevel1 swaps the whole `settings` slice in from storage, so an
	// install that persisted `settings` before this field existed rehydrates
	// without it.
	describe('rehydrating settings persisted before this field existed', () => {
		const staleRehydratedState = {
			unofficialityAcknowledged: true,
			devModeOverride: false,
			enabledCalendarSources: ['stolaf'],
		} as ReturnType<typeof reducer>

		test('the selector falls back to the tile gallery', () => {
			let rootState = {settings: staleRehydratedState} as RootState

			expect(selectDirectoryResultsView(rootState)).toBe('tiles')
		})
	})
})
