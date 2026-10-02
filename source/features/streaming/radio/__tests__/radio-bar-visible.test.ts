import {describe, expect, test} from '@jest/globals'

import {radioBarVisible} from '../bar-visibility'

describe('radioBarVisible', () => {
	test('shows the idle bar while the switch is on', () => {
		expect(radioBarVisible({stationId: null, showOnHome: true})).toBe(true)
	})

	test('hides the idle bar while the switch is off', () => {
		expect(radioBarVisible({stationId: null, showOnHome: false})).toBe(false)
	})

	test('a loaded station shows the bar whatever the switch says', () => {
		expect(radioBarVisible({stationId: 'krlx', showOnHome: false})).toBe(true)
		expect(radioBarVisible({stationId: 'krlx', showOnHome: true})).toBe(true)
	})
})
