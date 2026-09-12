import {beforeEach, describe, expect, it} from '@jest/globals'
import moment from 'moment-timezone'
import {useNowOverride} from '../override'

describe('the frozen-moment override', () => {
	beforeEach(() => {
		useNowOverride.getState().clear()
	})

	it('starts with no override', () => {
		expect(useNowOverride.getState().frozen).toBeNull()
	})

	it('holds the moment it is given', () => {
		let m = moment.tz('2026-09-07 10:05', 'America/Chicago')
		useNowOverride.getState().freeze(m)

		expect(useNowOverride.getState().frozen?.format('HH:mm')).toBe('10:05')
	})

	it('clears back to the real clock', () => {
		useNowOverride.getState().freeze(moment())
		useNowOverride.getState().clear()

		expect(useNowOverride.getState().frozen).toBeNull()
	})
})
