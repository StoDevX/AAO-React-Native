import {expect, it} from '@jest/globals'
import {formatBuildingTimes} from '../format-times'
import {dayMoment} from './moment.helper'
import {SingleBuildingScheduleType} from '../../types'

it('formats the times', () => {
	let m = dayMoment('Fri 3:00pm')
	let schedule: SingleBuildingScheduleType = {
		days: ['Fr'],
		from: '10:30am',
		to: '10:00pm',
	}

	expect(formatBuildingTimes(schedule, m)).toBe('10:30 AM — 10:00 PM')
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
