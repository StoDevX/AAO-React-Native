import {expect, it} from '@jest/globals'
import {findMenu} from '../../../../../modules/food-menu/lib/find-menu'
import moment from 'moment-timezone'
import type {DayPartsCollectionType} from '../../types'
import uniqueId from 'lodash/uniqueId'

const CENTRAL_TZ = 'America/Chicago'

const generateDayparts: (...parts: {start: string; end: string}[]) => DayPartsCollectionType = (
	...times
) => {
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

it('should return `undefined` if no menus are given', () => {
	let now = moment.tz('13:30', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts()
	expect(findMenu(dayparts, now)).toBeFalsy()
})

it('should return the station list if only one is given', () => {
	let now = moment.tz('8:30', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts({start: '13:00', end: '14:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the first menu, if `now` is before any open', () => {
	let now = moment.tz('8:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts({start: '10:00', end: '11:00'}, {start: '12:00', end: '13:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the last menu, if `now` is after all close', () => {
	let now = moment.tz('18:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts({start: '10:00', end: '11:00'}, {start: '12:00', end: '13:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the menu that is open at the given time', () => {
	let now = moment.tz('12:30', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the next menu if `now` is between two times', () => {
	let now = moment.tz('11:30', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

// Weitz Center publishes its dayparts in this order: Lunch, then the café
// that opened hours before it. Both close at three.
const weitz = () => generateDayparts({start: '11:00', end: '15:00'}, {start: '07:30', end: '15:00'})

it('should return the menu that is open, when a later one closes at the same time', () => {
	let now = moment.tz('8:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = weitz()

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the menu that opens first, if `now` is before any open', () => {
	let now = moment.tz('7:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = weitz()

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the menu that opened last, when two are open and close together', () => {
	let now = moment.tz('12:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = weitz()

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the menu that ends first, when two are open', () => {
	let now = moment.tz('9:30', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts({start: '07:00', end: '10:00'}, {start: '09:00', end: '13:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should give the minute a menu ends to the menu coming in', () => {
	let now = moment.tz('11:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts({start: '07:00', end: '11:00'}, {start: '11:00', end: '14:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the meal that closes last, not the one listed last, after all close', () => {
	let now = moment.tz('22:00', 'H:mm', true, CENTRAL_TZ)
	let dayparts = generateDayparts(
		{start: '17:00', end: '19:30'},
		{start: '7:00', end: '9:30'},
		{start: '11:00', end: '13:30'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})
