import {SingleBuildingScheduleType} from '../../types'
import {isScheduleOpenAtMoment} from '../is-schedule-open'
import {dayMoment} from './moment.helper'
import {expect, it} from '@jest/globals'

it('checks if a schedule is open at the provided moment', () => {
	let m = dayMoment('Fri 3:00pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '12:00am',
	}

	expect(isScheduleOpenAtMoment(schedule, m)).toBe(true)
})

it('returns true at the minute the schedule opens', () => {
	let m = dayMoment('Fri 10:30am')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '12:00am',
	}

	expect(isScheduleOpenAtMoment(schedule, m)).toBe(true)
})

it('returns false before the schedule opens', () => {
	let m = dayMoment('Fri 10:29am')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '12:00am',
	}

	expect(isScheduleOpenAtMoment(schedule, m)).toBe(false)
})

it('returns false after the schedule closes', () => {
	let m = dayMoment('Fri 1:01pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '1:00pm',
	}

	expect(isScheduleOpenAtMoment(schedule, m)).toBe(false)
})

it('returns false at the minute the schedule closes', () => {
	let m = dayMoment('Fri 1:00pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '1:00pm',
	}

	expect(isScheduleOpenAtMoment(schedule, m)).toBe(false)
})
