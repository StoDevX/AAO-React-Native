import {
	reducer,
	State,
	setNotificationsEnabled,
	setFeatureNotificationEnabled,
	selectNotificationsEnabled,
	selectFeatureNotificationEnabled,
	selectEnabledFeatures,
} from '../parts/notifications'
import {describe, it, expect} from '@jest/globals'
import type {RootState} from '../store'

// Minimal RootState stub — only the slice we're testing needs to be present.
function makeState(notifications: State): RootState {
	return {notifications} as unknown as RootState
}

describe('notifications reducer', () => {
	it('returns the initial state', () => {
		const state = reducer(undefined, {type: '@@INIT'})
		expect(state).toEqual({enabled: false, features: {}})
	})

	describe('setNotificationsEnabled', () => {
		it('enables the master toggle', () => {
			const state = reducer(undefined, setNotificationsEnabled(true))
			expect(state.enabled).toBe(true)
		})

		it('disables the master toggle', () => {
			const state = reducer(
				{enabled: true, features: {}},
				setNotificationsEnabled(false),
			)
			expect(state.enabled).toBe(false)
		})
	})

	describe('setFeatureNotificationEnabled', () => {
		it('adds a new feature enabled entry', () => {
			const state = reducer(
				undefined,
				setFeatureNotificationEnabled({featureId: 'menus', enabled: true}),
			)
			expect(state.features['menus']).toBe(true)
		})

		it('adds a new feature disabled entry', () => {
			const state = reducer(
				undefined,
				setFeatureNotificationEnabled({featureId: 'menus', enabled: false}),
			)
			expect(state.features['menus']).toBe(false)
		})

		it('updates an existing feature entry', () => {
			const prev: State = {enabled: false, features: {menus: true}}
			const state = reducer(
				prev,
				setFeatureNotificationEnabled({featureId: 'menus', enabled: false}),
			)
			expect(state.features['menus']).toBe(false)
		})

		it('does not affect other feature entries', () => {
			const prev: State = {enabled: false, features: {menus: true}}
			const state = reducer(
				prev,
				setFeatureNotificationEnabled({featureId: 'calendar', enabled: true}),
			)
			expect(state.features['menus']).toBe(true)
			expect(state.features['calendar']).toBe(true)
		})
	})
})

describe('notifications selectors', () => {
	describe('selectNotificationsEnabled', () => {
		it('returns false when disabled', () => {
			expect(
				selectNotificationsEnabled(makeState({enabled: false, features: {}})),
			).toBe(false)
		})

		it('returns true when enabled', () => {
			expect(
				selectNotificationsEnabled(makeState({enabled: true, features: {}})),
			).toBe(true)
		})
	})

	describe('selectFeatureNotificationEnabled', () => {
		it('defaults to false for unknown features', () => {
			const state = makeState({enabled: true, features: {}})
			expect(selectFeatureNotificationEnabled('menus')(state)).toBe(false)
		})

		it('returns the stored value for a known feature', () => {
			const state = makeState({enabled: true, features: {menus: true}})
			expect(selectFeatureNotificationEnabled('menus')(state)).toBe(true)
		})
	})

	describe('selectEnabledFeatures', () => {
		it('returns an empty array when no features are enabled', () => {
			const state = makeState({enabled: true, features: {menus: false}})
			expect(selectEnabledFeatures(state)).toEqual([])
		})

		it('returns only the enabled feature IDs, sorted', () => {
			const state = makeState({
				enabled: true,
				features: {menus: true, calendar: false, athletics: true},
			})
			expect(selectEnabledFeatures(state)).toEqual(['athletics', 'menus'])
		})

		it('returns an empty array when features map is empty', () => {
			const state = makeState({enabled: false, features: {}})
			expect(selectEnabledFeatures(state)).toEqual([])
		})
	})
})
