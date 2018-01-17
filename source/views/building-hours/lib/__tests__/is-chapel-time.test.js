// @flow
import {isChapelTime} from '../chapel'
import {dayMoment} from './moment.helper'

it('checks if a moment is during chapel time', () => {
	let m = isChapelTime(dayMoment('Mon 10:10am'))
	expect(m).toBe(true)
})

it('returns false if there is no chapel that day', () => {
	let m = isChapelTime(dayMoment('Sat 10:10am'))
	expect(m).toBe(false)
})

it('returns false if chapel is over', () => {
	let m = isChapelTime(dayMoment('Fri 1:00pm'))
	expect(m).toBe(false)
})
