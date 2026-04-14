import {expect, it} from '@jest/globals'
import {Temporal} from 'temporal-polyfill'
import {now as temporalNow, dayOfYear} from '../../../../../lib/temporal'
import {parseTime} from '../parse-time'

it('returns `null` given `false`', () => {
	let actual = parseTime(temporalNow())(false)
	expect(actual).toEqual(null)
})

it("returns a time (set to now's DOY) given a string", () => {
	// Use a fixed date to test DOY
	let fixedNow = Temporal.ZonedDateTime.from(
		'2019-01-10T12:00:00[America/Chicago]',
	)
	let actual = parseTime(fixedNow)('4:05pm')
	expect(actual).toBeTruthy()
	expect(dayOfYear(actual!)).toBe(10)
})
