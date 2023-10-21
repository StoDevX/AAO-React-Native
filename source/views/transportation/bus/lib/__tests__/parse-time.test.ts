import {parseTime} from '../parse-time'
import {expect, it} from '@jest/globals'
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
