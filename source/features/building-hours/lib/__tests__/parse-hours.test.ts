import {describe, expect, it} from '@jest/globals'
import {parseHours} from '../parse-hours'
import {dayMoment, hourMoment, plainMoment} from './moment.helper'
import {SingleBuildingScheduleType} from '../../types'

it('moves a close time earlier than the open time to the next day', () => {
	let now = hourMoment('10:01am')
	let input: SingleBuildingScheduleType = {
		days: [],
		from: '10:00am',
		to: '2:00am',
	}
	let {open, close} = parseHours(input, now)

	expect(close.isAfter(open)).toBe(true)
	expect(close.isAfter(now)).toBe(true)
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

		expect(now.isBetween(open, close)).toBe(true)
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

		expect(now.isBetween(open, close)).toBe(true)
	})

	it('reports open at 2:30am for a building open until 3am', () => {
		let time = '2018-11-11T02:30:00'
		let now = plainMoment(time, 'YYYY-MM-DD[T]HH:mm:ss')
		let input: SingleBuildingScheduleType = {
			days: [],
			from: '10:00pm',
			to: '3:00am',
		}
		let {open, close} = parseHours(input, now)

		expect(now.isBetween(open, close)).toBe(true)
	})

	it('reports closed at 4am after a 3am close', () => {
		let time = '2018-11-11T04:00:00'
		let now = plainMoment(time, 'YYYY-MM-DD[T]HH:mm:ss')
		let input: SingleBuildingScheduleType = {
			days: [],
			from: '10:00pm',
			to: '3:00am',
		}
		let {open, close} = parseHours(input, now)

		expect(now.isBetween(open, close)).toBe(false)
	})
})

// The Pause has closed at 2:00am before, and the clocks change at 2:00am, so
// a late close meets daylight saving from both sides.
describe('a window closing at 2:00am across a clock change', () => {
	let schedule: SingleBuildingScheduleType = {days: [], from: '4:00pm', to: '2:00am'}
	let at = (utc: string) => moment.utc(utc).tz('America/Chicago')
	let running = (m: moment.Moment) => {
		let {open, close} = parseHours(schedule, m)
		return m.isBetween(open, close, 'minute', '[)')
	}

	// At 2:00am CST on 2026-03-08 the clocks jump to 3:00am CDT. The window
	// opening that Sunday still closes at 2:00am on Monday.
	it('closes the window opening on the spring-forward day at 2:00am the next day', () => {
		let sundayNight = at('2026-03-09T04:00:00Z')
		expect(sundayNight.format('ddd HH:mm Z')).toBe('Sun 23:00 -05:00')

		expect(parseHours(schedule, sundayNight).close.format()).toBe('2026-03-09T02:00:00-05:00')
		expect(running(at('2026-03-09T07:30:00Z'))).toBe(false)
	})

	// At 2:00am CDT on 2026-11-01 the clocks go back to 1:00am CST, so the
	// window runs through the repeated hour and closes at 2:00am CST.
	it('stays open through the hour the fall-back night repeats', () => {
		let repeated = at('2026-11-01T07:30:00Z')
		expect(repeated.format('HH:mm Z')).toBe('01:30 -06:00')

		expect(running(repeated)).toBe(true)
		expect(parseHours(schedule, repeated).close.format()).toBe('2026-11-01T02:00:00-06:00')
	})
})

describe('anchors a window on the day it opens, not the day it is read', () => {
	// 2026-09-11 is a Friday, 2026-09-12 a Saturday, 2026-09-13 a Sunday.
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr', 'Sa'],
		from: '9:00pm',
		to: '2:00am',
	}

	let at = (date: string, time: string) => plainMoment(`${date}T${time}`, 'YYYY-MM-DD[T]HH:mm:ss')

	it('returns Saturday night when read early Sunday', () => {
		let {open, close} = parseHours(schedule, at('2026-09-13', '01:00:00'))

		expect(open.format('YYYY-MM-DD HH:mm')).toBe('2026-09-12 21:00')
		expect(close.format('YYYY-MM-DD HH:mm')).toBe('2026-09-13 02:00')
	})

	it('does not borrow a night the schedule never runs', () => {
		// Thursday night is not in `days`, so Friday at 1:00am falls outside
		// every window this schedule describes.
		let m = at('2026-09-11', '01:00:00')
		let {open, close} = parseHours(schedule, m)

		expect(m.isBetween(open, close, 'minute', '[)')).toBe(false)
	})
})
