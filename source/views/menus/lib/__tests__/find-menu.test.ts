import {expect, it} from '@jest/globals'
import {findMenu} from '../../../../../modules/food-menu/lib/find-menu'
import {Temporal} from 'temporal-polyfill'
import type {DayPartsCollectionType} from '../../types'
import uniqueId from 'lodash/uniqueId'

const CENTRAL_TZ = 'America/Chicago'

const generateDayparts: (
	...parts: {start: string; end: string}[]
) => DayPartsCollectionType = (...times) => {
	let dayparts = times.map(({start, end}) => ({
		starttime: start,
		endtime: end,
		id: String(uniqueId()),
		label: '',
		abbreviation: '',
		stations: [],
	}))
	return [dayparts]
}

function makeNow(timeStr: string): Temporal.ZonedDateTime {
	const [h, m] = timeStr.split(':').map(Number)
	const base = Temporal.Now.zonedDateTimeISO(CENTRAL_TZ)
	return base.with({
		hour: h,
		minute: m,
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	})
}

it('should return `undefined` if no menus are given', () => {
	let now = makeNow('13:30')
	let dayparts = generateDayparts()
	expect(findMenu(dayparts, now)).toBeFalsy()
})

it('should return the station list if only one is given', () => {
	let now = makeNow('8:30')
	let dayparts = generateDayparts({start: '13:00', end: '14:00'})
	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the first menu, if `now` is before any open', () => {
	let now = makeNow('8:00')
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
	)
	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the last menu, if `now` is after all close', () => {
	let now = makeNow('18:00')
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
	)
	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the menu that is open at the given time', () => {
	let now = makeNow('12:30')
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)
	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the next menu if `now` is between two times', () => {
	let now = makeNow('11:30')
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)
	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})
