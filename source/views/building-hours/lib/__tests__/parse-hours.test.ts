import {expect, it, xdescribe, describe} from '@jest/globals'
import {Temporal} from 'temporal-polyfill'
import {parseHours} from '../parse-hours'
import {isBetween, isBefore} from '../../../../lib/temporal'
import {dayMoment, hourMoment, plainMoment} from './temporal.helper'
import {SingleBuildingScheduleType} from '../../types'

it('returns an {open, close} tuple', () => {
	let now = hourMoment('10:01am')
	let input: SingleBuildingScheduleType = {
		days: [],
		from: '10:00am',
		to: '4:00pm',
	}
	let actual = parseHours(input, now)

	expect(actual).toBeDefined()
	expect(actual.open).toBeDefined()
	expect(actual.close).toBeDefined()
})

it('returns a ZonedDateTime for .open', () => {
	let now = hourMoment('10:01am')
	let input: SingleBuildingScheduleType = {
		days: [],
		from: '10:00am',
		to: '4:00pm',
	}
	let {open} = parseHours(input, now)
	expect(open instanceof Temporal.ZonedDateTime).toBe(true)
})

it('returns a ZonedDateTime for .close', () => {
	let now = hourMoment('10:01am')
	let input: SingleBuildingScheduleType = {
		days: [],
		from: '10:00am',
		to: '4:00pm',
	}
	let {close} = parseHours(input, now)
	expect(close instanceof Temporal.ZonedDateTime).toBe(true)
})

it('will add a day to the close time with nextDay:true', () => {
	let now = hourMoment('10:01am')
	let input: SingleBuildingScheduleType = {
		days: [],
		from: '10:00am',
		to: '2:00am',
	}
	let {open, close} = parseHours(input, now)

	expect(Temporal.ZonedDateTime.compare(close, open)).toBeGreaterThan(0)
	expect(Temporal.ZonedDateTime.compare(close, now)).toBeGreaterThan(0)
})

describe('handles weird times', () => {
	it('handles Friday at 4:30pm', () => {
		let now = dayMoment('Fri 4:30pm')
		let input: SingleBuildingScheduleType = {
			days: [],
			from: '10:00am',
			to: '2:00am',
		}
		let {open, close} = parseHours(input, now)

		expect(isBetween(now, open, close)).toBe(true)
	})

	it('handles Saturday at 1:30am', () => {
		// TODO: report a bug to moment-timezone that tz("Sat 1:30am", "ddd h:mma") is invalid (at least when `moment.now` = 2018-11-09)
		let saturday = '2018-11-11T01:30:00'
		let now = plainMoment(saturday, 'YYYY-MM-DD[T]HH:mm:ss')
		let input: SingleBuildingScheduleType = {
			days: [],
			from: '10:00am',
			to: '2:00am',
		}
		let {open, close} = parseHours(input, now)

		expect(isBetween(now, open, close)).toBe(true)
	})
})

xdescribe('checks a list of schedules to see if any are open', () => {
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr', 'Sa'],
		from: '10:30am',
		to: '2:00am',
	}

	it('in normal, non-dst situations', () => {
		let now = plainMoment('06-24-2018 12:00am', 'MM-DD-YYYY h:mma')
		let {open, close} = parseHours(schedule, now)
		expect(`${open.hour}:${String(open.minute).padStart(2, '0')}`).toBe('10:30')
		expect(`${close.hour}:${String(close.minute).padStart(2, '0')}`).toBe(
			'02:00',
		)
	})

	it('during the spring-forward dst', () => {
		let now = plainMoment('03-12-2018 12:00am', 'MM-DD-YYYY h:mma')
		let {open, close} = parseHours(schedule, now)
		expect(`${open.hour}:${String(open.minute).padStart(2, '0')}`).toBe('10:30')
		expect(`${close.hour}:${String(close.minute).padStart(2, '0')}`).toBe(
			'01:00',
		)
	})

	it('during the fall-back dst', () => {
		let now = plainMoment('11-4-2018 12:00am', 'MM-DD-YYYY h:mma')
		let {open, close} = parseHours(schedule, now)
		expect(`${open.hour}:${String(open.minute).padStart(2, '0')}`).toBe('10:30')
		expect(`${close.hour}:${String(close.minute).padStart(2, '0')}`).toBe(
			'02:00',
		)
	})
})

void isBefore
