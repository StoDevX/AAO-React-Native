import {expect, it} from '@jest/globals'
import {parseTime} from '../parse-time'
import moment from 'moment'

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
