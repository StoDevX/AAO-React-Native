/* eslint-env jest */
// @flow
import {findMenu} from '../find-menu'
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
import type {DayPartsCollectionType} from '../../types'
import uniqueId from 'lodash/uniqueId'

const generateDayparts: (
	...{start: string, end: string}[]
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

it('should return `undefined` if no menus are given', () => {
	const now = moment.tz('13:30', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts()
	expect(findMenu(dayparts, now)).toBeFalsy()
})

it('should return the station list if only one is given', () => {
	const now = moment.tz('8:30', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts({start: '13:00', end: '14:00'})

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the first menu, if `now` is before any open', () => {
	const now = moment.tz('8:00', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][0])
})

it('should return the last menu, if `now` is after all close', () => {
	const now = moment.tz('18:00', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the menu that is open at the given time', () => {
	const now = moment.tz('12:30', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})

it('should return the next menu if `now` is between two times', () => {
	const now = moment.tz('11:30', 'H:mm', true, CENTRAL_TZ)
	const dayparts = generateDayparts(
		{start: '10:00', end: '11:00'},
		{start: '12:00', end: '13:00'},
		{start: '14:00', end: '15:00'},
	)

	expect(findMenu(dayparts, now)).toBe(dayparts[0][1])
})
