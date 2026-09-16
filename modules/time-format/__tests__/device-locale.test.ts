import {beforeEach, describe, expect, jest, test} from '@jest/globals'

/**
 * `deviceLocale()` is what makes `formatTime()` (and every other exported
 * helper) actually respond to the OS's 24-hour-clock preference when no
 * locale is passed -- the whole reason this module exists. Every other test
 * in this package passes a locale explicitly and never touches it. `jest`'s
 * module registry is reset between tests so each one gets its own
 * `deviceLocale()` memo instead of reusing whatever an earlier test cached.
 */
describe('deviceLocale', () => {
	beforeEach(() => {
		jest.resetModules()
	})

	test('composes the OS 24-hour preference into the default locale', () => {
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag: 'en-US'}],
			getCalendars: () => [{uses24hourClock: true}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		// oxlint-disable-next-line typescript/no-require-imports
		let moment = require('moment-timezone')

		let m = moment.tz('2026-08-20 17:30', 'America/Chicago')
		expect(formatTime(m)).toBe('17:30')
	})

	test('falls back to the locale-default hour cycle when the OS reports none', () => {
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag: 'en-US'}],
			getCalendars: () => [{uses24hourClock: false}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		// oxlint-disable-next-line typescript/no-require-imports
		let moment = require('moment-timezone')

		let m = moment.tz('2026-08-20 17:30', 'America/Chicago')
		expect(formatTime(m)).toBe('5:30 PM')
	})

	test('falls back to en-US when the device reports no locale at all', () => {
		jest.doMock('expo-localization', () => ({
			getLocales: () => [],
			getCalendars: () => [],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		// oxlint-disable-next-line typescript/no-require-imports
		let moment = require('moment-timezone')

		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')
		expect(formatTime(m)).toBe('5 PM')
	})
})
