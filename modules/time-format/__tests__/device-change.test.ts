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

	/**
	 * `Intl.DateTimeFormat()` with no arguments is `currentDeviceZone()`'s own
	 * probe -- substituted here so a test can move "the device's zone"
	 * without disturbing real formatter construction, which always calls
	 * with a locale and options and is left to build for real. Counting only
	 * the two-argument calls is how a test tells "a formatter was actually
	 * rebuilt" apart from "the zone was merely checked."
	 */
	const spyWithDeviceZone = (getZone: () => string) => {
		let RealDateTimeFormat = Intl.DateTimeFormat
		return jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args: unknown[]) => {
			if (args.length === 0) {
				return {resolvedOptions: () => ({timeZone: getZone()})} as Intl.DateTimeFormat
			}
			return new RealDateTimeFormat(...(args as ConstructorParameters<typeof Intl.DateTimeFormat>))
		})
	}

	const rebuiltFormatterCount = (spy: jest.SpiedFunction<typeof Intl.DateTimeFormat>) =>
		spy.mock.calls.filter((args) => args.length > 0).length

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
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag: 'en-US'}],
			getCalendars: () => [{uses24hourClock: false}],
		}))
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	test('leaves a cached formatter alone across a resume when the zone has not changed', () => {
		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		let spy = spyWithDeviceZone(() => 'America/Chicago')
		formatTime(m)
		let before = rebuiltFormatterCount(spy)

		sendAppState('background')
		sendAppState('active')
		formatTime(m)

		expect(rebuiltFormatterCount(spy)).toBe(before)
	})

	test('rebuilds the cache across a resume when the zone changed', () => {
		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		let zone = 'America/Chicago'
		let spy = spyWithDeviceZone(() => zone)
		formatTime(m)
		let before = rebuiltFormatterCount(spy)

		zone = 'Asia/Tokyo'
		sendAppState('background')
		sendAppState('active')
		formatTime(m)

		expect(rebuiltFormatterCount(spy)).toBeGreaterThan(before)
	})

	test('a locale change alone, with the same zone, does not clear the formatter cache', () => {
		// `NUMBER_FORMATTERS` and `MERIDIEM` are keyed by locale, so a locale
		// change is self-correcting for them without any active invalidation
		// -- this is the mechanism `refreshFormattersIfZoneChanged` leaves
		// alone. Only the zone axis is checked on resume.
		let languageTag = 'en-US'
		jest.doMock('expo-localization', () => ({
			getLocales: () => [{languageTag}],
			getCalendars: () => [{uses24hourClock: false}],
		}))

		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		let spy = spyWithDeviceZone(() => 'America/Chicago')
		formatTime(m)
		let before = rebuiltFormatterCount(spy)

		languageTag = 'ja-JP'
		sendAppState('background')
		sendAppState('active')
		formatTime(m) // still no explicit locale -- exercises deviceLocale()'s own (separately accepted) staleness

		expect(rebuiltFormatterCount(spy)).toBe(before)
	})

	test('does nothing on resume if nothing has been formatted yet this session', () => {
		// oxlint-disable-next-line typescript/no-require-imports
		require('../index')

		expect(() => {
			sendAppState('background')
			sendAppState('active')
		}).not.toThrow()
	})

	test('notices a zone change even when every call passes an explicit locale', () => {
		// The baseline lives in `formatterFor`'s own cache miss, not in
		// `deviceLocale()` -- a caller that never touches the device-default
		// path still gets its stale formatters caught on resume.
		// oxlint-disable-next-line typescript/no-require-imports
		let {formatTime} = require('../index')
		let m = moment.tz('2026-08-20 17:00', 'America/Chicago')

		let zone = 'America/Chicago'
		let spy = spyWithDeviceZone(() => zone)
		formatTime(m, 'en-US')
		let before = rebuiltFormatterCount(spy)

		zone = 'Asia/Tokyo'
		sendAppState('background')
		sendAppState('active')
		formatTime(m, 'en-US')

		expect(rebuiltFormatterCount(spy)).toBeGreaterThan(before)
	})
})
