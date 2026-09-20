import {expect, it, test} from '@jest/globals'
import {parseTime} from '../parse-time'
import moment from 'moment-timezone'

it('returns `null` given `false`', () => {
	let actual = parseTime(moment())(false)
	expect(actual).toEqual(null)
})

it("returns a time (set to now's DOY) given a string", () => {
	let doy = 10
	let now = moment().dayOfYear(doy)
	let actual = parseTime(now)('4:05pm')
	expect(actual).toBeTruthy()
	expect(actual?.dayOfYear()).toBe(doy)
})

it('returns `null` given a string that fails to parse', () => {
	// A malformed feed value fails the strict-mode 'h:mma' parse. An Invalid
	// Moment is still truthy, so returning one would read as real data
	// everywhere a caller checks for null or false.
	let actual = parseTime(moment())('not a time')
	expect(actual).toEqual(null)
})

test('parseTime interprets a time in an explicitly supplied zone', () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')
	let central = parseTime(now, 'America/Chicago')('4:05pm')
	let eastern = parseTime(now, 'America/New_York')('4:05pm')

	expect(central).not.toBeNull()
	expect(eastern).not.toBeNull()
	// The same wall-clock reading in two zones is not the same instant.
	expect(central?.valueOf()).not.toEqual(eastern?.valueOf())
})

test('parseTime falls back to the app timezone when none is supplied', () => {
	let now = moment.tz('2026-08-20 12:00', 'America/Chicago')

	expect(parseTime(now)('4:05pm')?.valueOf()).toEqual(
		parseTime(now, 'America/Chicago')('4:05pm')?.valueOf(),
	)
})
