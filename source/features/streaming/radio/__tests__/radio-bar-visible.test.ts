import {describe, expect, test} from '@jest/globals'

import {radioBarVisible} from '../bar-visibility'

describe('radioBarVisible', () => {
	test('shows the idle bar while the switch is on', () => {
		expect(radioBarVisible({stationId: null, showOnHome: true, hydrated: true})).toBe(true)
	})

	test('hides the idle bar while the switch is off', () => {
		expect(radioBarVisible({stationId: null, showOnHome: false, hydrated: true})).toBe(false)
	})

	test('a loaded station shows the bar whatever the switch says', () => {
		expect(radioBarVisible({stationId: 'krlx', showOnHome: false, hydrated: true})).toBe(true)
		expect(radioBarVisible({stationId: 'krlx', showOnHome: true, hydrated: true})).toBe(true)
	})

	test('hides the idle bar until the saved switch has loaded, so it cannot flash', () => {
		expect(radioBarVisible({stationId: null, showOnHome: true, hydrated: false})).toBe(false)
	})
})
