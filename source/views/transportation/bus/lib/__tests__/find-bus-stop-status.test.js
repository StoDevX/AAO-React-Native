// @flow
import {findBusStopStatus} from '../find-bus-stop-status'

import {getScheduleForNow} from '../get-schedule-for-now'
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusSchedule, BusSchedule} from '../../types'

function buildBusSchedules(now): Array<BusSchedule> {
	// prettier-ignore
	const schedules: Array<UnprocessedBusSchedule> = [
    {
      days: ['Mo', 'Tu'],
      coordinates: {},
      stops: ['St. Olaf', 'Carleton', 'Third'],
      times: [['1:00pm',  '1:05pm',   '1:10pm'],
              ['2:00pm',  false,      '2:10pm'],
              ['3:00pm',  '3:05pm',   '3:10pm'],
      ],
    },
    {
      days: ['We'],
      coordinates: {},
      stops: ['St. Olaf', 'Carleton'],
      times: [['12:00pm', '12:05pm']],
    },
  ]
	return schedules.map(processBusSchedule(now))
}

function makeSchedule(now) {
	const schedule = getScheduleForNow(buildBusSchedules(now), now)
	const {status, index} = getCurrentBusIteration(schedule, now)
	return {schedule, busStatus: status, departureIndex: index}
}

test('handles a time before the bus runs', () => {
	const now = dayAndTime('Mo 12:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('before')
})

test('handles a time right when the bus starts', () => {
	const now = dayAndTime('Mo 1:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles a time between two stops', () => {
	const now = dayAndTime('Mo 1:01pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[1]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('before')
})

test('handles a time at the second stop', () => {
	const now = dayAndTime('Mo 1:05pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[1]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles a time at the last stop', () => {
	const now = dayAndTime('Mo 1:10pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[schedule.timetable.length - 1]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles a time between two iterations', () => {
	const now = dayAndTime('Mo 1:55pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('before')
})

test('handles the first stop of the second iteration', () => {
	const now = dayAndTime('Mo 2:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles the first stop of the last iteration', () => {
	const now = dayAndTime('Mo 3:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles the last stop of the last iteration', () => {
	const now = dayAndTime('Mo 3:10pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[schedule.timetable.length - 1]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles a stop that will be skipped', () => {
	const now = dayAndTime('Mo 2:05pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[1]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('skip')
})

test('handles a time after the bus runs', () => {
	const now = dayAndTime('Mo 11:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('after')
})

test('handles a time on another day', () => {
	const now = dayAndTime('We 12:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('at')
})

test('handles a time when the bus is not running', () => {
	const now = dayAndTime('Sa 1:00pm')
	const {schedule, busStatus, departureIndex} = makeSchedule(now)
	const stop = schedule.timetable[0]
	const actual = findBusStopStatus({stop, departureIndex, busStatus, now})
	expect(actual).toBe('skip')
})
