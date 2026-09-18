import {expect, it} from '@jest/globals'
import {formatBuildingTimes, formatStatusTime} from '../format-times'
import {dayMoment, hourMoment} from './moment.helper'
import {SingleBuildingScheduleType} from '../../types'

it('formats the times', () => {
	let m = dayMoment('Fri 3:00pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '10:00pm',
	}

	expect(formatBuildingTimes(schedule, m)).toBe('10:30 AM — 10 PM')
})

it('changes 12:00am into "Midnight"', () => {
	let m = dayMoment('Fri 3:00pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '12:00am',
	}

	expect(formatBuildingTimes(schedule, m)).toBe('10:30 AM — Midnight')
})

it('spells 12:00am as "midnight" inside a sentence', () => {
	expect(formatStatusTime(hourMoment('12:00am'))).toBe('midnight')
})

it('spells 12:00pm as "noon" inside a sentence', () => {
	expect(formatStatusTime(hourMoment('12:00pm'))).toBe('noon')
})

it('leaves an ordinary time to the locale formatter', () => {
	expect(formatStatusTime(hourMoment('8:00pm'))).toBe('8 PM')
})

it('passes the locale through', () => {
	expect(formatStatusTime(hourMoment('8:00pm'), 'en-GB')).toBe('20:00')
})
