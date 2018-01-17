// @flow
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
	// $FlowExpectedError: Method cannot be called on possibly null value
	expect(actual.dayOfYear()).toBe(doy)
})
