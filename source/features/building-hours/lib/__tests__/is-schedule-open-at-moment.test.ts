import {describe, expect, it} from '@jest/globals'
import {isScheduleOpenAtMoment} from '../is-schedule-open'
import {dayMoment} from './moment.helper'
import {SingleBuildingScheduleType} from '../../types'

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

describe('the chapel guard', () => {
	it('closes for chapel when the schedule opts in', () => {
		// Thursday chapel runs 11:00am - 12:35pm.
		let m = dayMoment('Thu 11:30am')
		let schedule: SingleBuildingScheduleType = {
			days: ['Th'],
			from: '10:30am',
			to: '2:00pm',
		}

		expect(isScheduleOpenAtMoment(schedule, m, true)).toBe(false)
	})

	it('does not close for chapel when the schedule does not opt in', () => {
		// Carleton has no chapel, and never sets `closedForChapelTime` -- a
		// Carleton lunch service must stay open straight through the window St.
		// Olaf's chapel occupies, e.g. Burton at Thursday 11:30am.
		let m = dayMoment('Thu 11:30am')
		let schedule: SingleBuildingScheduleType = {
			days: ['Th'],
			from: '10:30am',
			to: '2:00pm',
		}

		expect(isScheduleOpenAtMoment(schedule, m)).toBe(true)
		expect(isScheduleOpenAtMoment(schedule, m, false)).toBe(true)
	})

	it('still applies ordinary open/close rules outside chapel, regardless of the flag', () => {
		let m = dayMoment('Thu 9:00am')
		let schedule: SingleBuildingScheduleType = {
			days: ['Th'],
			from: '10:30am',
			to: '2:00pm',
		}

		expect(isScheduleOpenAtMoment(schedule, m, true)).toBe(false)
	})
})
