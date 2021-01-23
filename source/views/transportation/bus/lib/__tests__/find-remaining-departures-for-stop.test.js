import {findRemainingDeparturesForStop} from '../find-remaining-departures-for-stop'

import {getScheduleForNow} from '../get-schedule-for-now'
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusSchedule, BusSchedule} from '../../types'

function buildBusSchedules(now): Array<BusSchedule> {
	// prettier-ignore
	let schedules: Array<UnprocessedBusSchedule> = [
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

const formatTime = (m) => (m ? m.format('h:mma') : null)

function makeSchedule(now) {
	let schedule = getScheduleForNow(buildBusSchedules(now), now)
	let {status, index} = getCurrentBusIteration(schedule, now)
	return {schedule, busStatus: status, departureIndex: index}
}

test('handles a time before the bus runs', () => {
	let now = dayAndTime('Mo 12:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time right when the bus starts', () => {
	let now = dayAndTime('Mo 1:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time between two stops', () => {
	let now = dayAndTime('Mo 1:01pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[1]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time at the second stop', () => {
	let now = dayAndTime('Mo 1:05pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[1]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time at the last stop', () => {
	let now = dayAndTime('Mo 1:10pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[schedule.timetable.length - 1]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time between two iterations', () => {
	let now = dayAndTime('Mo 1:55pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles the first stop of the second iteration', () => {
	let now = dayAndTime('Mo 2:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles the first stop of the last iteration', () => {
	let now = dayAndTime('Mo 3:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles the last stop of the last iteration', () => {
	let now = dayAndTime('Mo 3:10pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[schedule.timetable.length - 1]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a stop that will be skipped', () => {
	let now = dayAndTime('Mo 2:05pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[1]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time after the bus runs', () => {
	let now = dayAndTime('Mo 11:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time on another day', () => {
	let now = dayAndTime('We 12:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})

test('handles a time when the bus is not running', () => {
	let now = dayAndTime('Sa 1:00pm')
	let {schedule, busStatus, departureIndex} = makeSchedule(now)
	let stop = schedule.timetable[0]
	let actual = findRemainingDeparturesForStop({
		stop,
		departureIndex,
		busStatus,
	})
	expect(actual.map(formatTime)).toMatchSnapshot()
})
