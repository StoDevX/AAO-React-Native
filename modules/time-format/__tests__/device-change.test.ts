import {AppState, type AppStateStatus} from 'react-native'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'

/**
 * `AppState` events come from the native side, so the only way to drive
 * these tests is to keep the handler the module registers and call it.
 * `jest.resetModules()` per test gives each one a fresh module instance, so
 * the listener (and the caches behind it) start over rather than leaking
 * across tests.
 */
describe('returning to the foreground', () => {
	let appStateHandlers: ((status: AppStateStatus) => void)[] = []

	const sendAppState = (status: AppStateStatus) => {
		for (let handler of appStateHandlers) handler(status)
	}

	beforeEach(() => {
		jest.resetModules()
		appStateHandlers = []
		jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
			let changeHandler = handler as (status: AppStateStatus) => void
			if (type === 'change') appStateHandlers.push(changeHandler)
			return {
				remove: () => {
					appStateHandlers = appStateHandlers.filter((each) => each !== changeHandler)
				},
			}
		})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	/**
	 * `Intl.DateTimeFormat()` with no arguments is `refreshIfDeviceChanged`'s
	 * own zone probe, run on every resume regardless of the outcome -- only a
	 * call with a locale and options is a real formatter being rebuilt.
	 */
	const rebuiltFormatterCount = (spy: jest.SpiedFunction<typeof Intl.DateTimeFormat>) =>
		spy.mock.calls.filter((args) => args.length > 0).length

	test('leaves a cached formatter alone when the device has not changed', () => {
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag: 'en-US'}],
			getCalendars: () => [{uses24hourClock: false}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		formatTime(m)

		let spy = jest.spyOn(Intl, 'DateTimeFormat')
		sendAppState('background')
		sendAppState('active')
		formatTime(m)

		expect(rebuiltFormatterCount(spy)).toBe(0)
	})

	test('rebuilds the cache when the device locale changed', () => {
		let languageTag = 'en-US'
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag}],
			getCalendars: () => [{uses24hourClock: false}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		formatTime(m)
		languageTag = 'ja-JP'

		let spy = jest.spyOn(Intl, 'DateTimeFormat')
		sendAppState('background')
		sendAppState('active')
		formatTime(m)

		expect(rebuiltFormatterCount(spy)).toBeGreaterThan(0)
	})

	test('does nothing on resume if nothing has been formatted yet this session', () => {
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag: 'en-US'}],
			getCalendars: () => [{uses24hourClock: false}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		require('../index')

		expect(() => {
			sendAppState('background')
			sendAppState('active')
		}).not.toThrow()
	})
})
