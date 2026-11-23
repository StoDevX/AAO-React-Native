import {describe, expect, test} from '@jest/globals'

import {radioBarVisible} from '../bar-visibility'

describe('radioBarVisible', () => {
	test('shows the idle bar while the switch is on', () => {
		expect(
			radioBarVisible({
				stationId: null,
				showOnHome: true,
				hydrated: true,
				isDev: true,
				anyStationOn: true,
			}),
		).toBe(true)
	})

	test('hides the idle bar while the switch is off', () => {
		expect(
			radioBarVisible({
				stationId: null,
				showOnHome: false,
				hydrated: true,
				isDev: true,
				anyStationOn: true,
			}),
		).toBe(false)
	})

	test('a loaded station shows the bar whatever the switch says', () => {
		expect(
			radioBarVisible({
				stationId: 'krlx',
				showOnHome: false,
				hydrated: true,
				isDev: true,
				anyStationOn: true,
			}),
		).toBe(true)
		expect(
			radioBarVisible({
				stationId: 'krlx',
				showOnHome: true,
				hydrated: true,
				isDev: true,
				anyStationOn: true,
			}),
		).toBe(true)
	})

	test('hides the idle bar until the saved switch has loaded, so it cannot flash', () => {
		expect(
			radioBarVisible({
				stationId: null,
				showOnHome: true,
				hydrated: false,
				isDev: true,
				anyStationOn: true,
			}),
		).toBe(false)
	})

	test('shows the bar outside dev mode once a station is switched on', () => {
		expect(
			radioBarVisible({
				stationId: 'krlx',
				showOnHome: true,
				hydrated: true,
				isDev: false,
				anyStationOn: true,
			}),
		).toBe(true)
	})

	test('shows the bar in dev mode even while every station is switched off', () => {
		expect(
			radioBarVisible({
				stationId: null,
				showOnHome: true,
				hydrated: true,
				isDev: true,
				anyStationOn: false,
			}),
		).toBe(true)
	})

	test('hides the bar outside dev mode while every station is switched off', () => {
		expect(
			radioBarVisible({
				stationId: 'krlx',
				showOnHome: true,
				hydrated: true,
				isDev: false,
				anyStationOn: false,
			}),
		).toBe(false)
	})
})
