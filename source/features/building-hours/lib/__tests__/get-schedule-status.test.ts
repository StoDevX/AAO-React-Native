import {expect, it} from '@jest/globals'
import {getScheduleStatusAtMoment} from '../get-schedule-status'
import {dayMoment} from './moment.helper'
import {SingleBuildingScheduleType} from '../../types'

const allDay: SingleBuildingScheduleType = {days: ['Fr'], from: '10:30am', to: '12:00am'}

it('reads Open while the window is running', () => {
	expect(getScheduleStatusAtMoment(allDay, dayMoment('Fri 3:00pm'))).toBe('Open')
})

it('reads Open on the minute it opens', () => {
	expect(getScheduleStatusAtMoment(allDay, dayMoment('Fri 10:30am'))).toBe('Open')
})

it('reads Almost Open within half an hour of opening', () => {
	let m = dayMoment('Fri 10:29:00am', 'ddd h:mm:ssa')
	expect(getScheduleStatusAtMoment(allDay, m)).toBe('Almost Open')
})

it('reads Almost Closed within half an hour of closing', () => {
	let m = dayMoment('Fri 11:55:00pm', 'ddd h:mm:ssa')
	expect(getScheduleStatusAtMoment(allDay, m)).toBe('Almost Closed')
})

it('reads Closed once the window has passed', () => {
	let schedule: SingleBuildingScheduleType = {days: ['Fr'], from: '10:30am', to: '1:00pm'}
	expect(getScheduleStatusAtMoment(schedule, dayMoment('Fri 1:01pm'))).toBe('Closed')
})

it('reads Closed well before the window opens', () => {
	let schedule: SingleBuildingScheduleType = {days: ['Tu'], from: '8:00am', to: '1:00pm'}
	expect(getScheduleStatusAtMoment(schedule, dayMoment('Tue 6:00am'))).toBe('Closed')
})
