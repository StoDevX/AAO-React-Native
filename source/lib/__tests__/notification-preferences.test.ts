import {act} from '@testing-library/react-native'
import {describe, it, expect, beforeEach} from '@jest/globals'

import {useNotificationPreferences} from '../notification-preferences'

describe('notification preferences store', () => {
	beforeEach(() => {
		act(() => {
			useNotificationPreferences.setState({enabled: false, features: {}})
		})
	})

	describe('setEnabled', () => {
		it('enables the master toggle', () => {
			act(() => {
				useNotificationPreferences.getState().setEnabled(true)
			})
			expect(useNotificationPreferences.getState().enabled).toBe(true)
		})

		it('disables the master toggle', () => {
			act(() => {
				useNotificationPreferences.getState().setEnabled(true)
				useNotificationPreferences.getState().setEnabled(false)
			})
			expect(useNotificationPreferences.getState().enabled).toBe(false)
		})
	})

	describe('setFeatureEnabled', () => {
		it('enables a new feature', () => {
			act(() => {
				useNotificationPreferences.getState().setFeatureEnabled('menus', true)
			})
			expect(useNotificationPreferences.getState().features['menus']).toBe(true)
		})

		it('disables a feature', () => {
			act(() => {
				useNotificationPreferences.getState().setFeatureEnabled('menus', true)
				useNotificationPreferences.getState().setFeatureEnabled('menus', false)
			})
			expect(useNotificationPreferences.getState().features['menus']).toBe(
				false,
			)
		})

		it('does not affect other feature entries', () => {
			act(() => {
				useNotificationPreferences.getState().setFeatureEnabled('menus', true)
				useNotificationPreferences
					.getState()
					.setFeatureEnabled('calendar', true)
			})
			expect(useNotificationPreferences.getState().features['menus']).toBe(true)
			expect(useNotificationPreferences.getState().features['calendar']).toBe(
				true,
			)
		})
	})

	describe('enabledFeatures', () => {
		it('returns an empty array when no features are enabled', () => {
			act(() => {
				useNotificationPreferences.getState().setFeatureEnabled('menus', false)
			})
			expect(useNotificationPreferences.getState().enabledFeatures()).toEqual(
				[],
			)
		})

		it('returns only the enabled feature IDs, sorted', () => {
			act(() => {
				useNotificationPreferences.getState().setFeatureEnabled('menus', true)
				useNotificationPreferences
					.getState()
					.setFeatureEnabled('calendar', false)
				useNotificationPreferences
					.getState()
					.setFeatureEnabled('athletics', true)
			})
			expect(useNotificationPreferences.getState().enabledFeatures()).toEqual([
				'athletics',
				'menus',
			])
		})

		it('returns an empty array when the features map is empty', () => {
			expect(useNotificationPreferences.getState().enabledFeatures()).toEqual(
				[],
			)
		})
	})
})
