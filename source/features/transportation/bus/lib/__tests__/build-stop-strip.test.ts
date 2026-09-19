import {expect, test} from '@jest/globals'
import moment from 'moment'

import {buildStopStrip} from '../build-stop-strip'
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {getScheduleForNow} from '../get-schedule-for-now'
import {processBusSchedule} from '../process-bus-line'
import {dayAndTime} from './moment.helper'

import type {BusSchedule, UnprocessedBusSchedule} from '../../types'

function buildBusSchedules(now: moment.Moment): Array<BusSchedule> {
	// prettier-ignore
	let schedules: Array<UnprocessedBusSchedule> = [
		{
			days: ['Mo', 'Tu'],
			coordinates: {},
			stops: ['St. Olaf', 'Carleton', 'Third'],
			times: [['1:00pm', '1:05pm', '1:10pm'],
			        ['2:00pm', false,    '2:10pm'],
			        ['3:00pm', '3:05pm', '3:10pm'],
			],
		},
	]
	return schedules.map(processBusSchedule(now))
}

function stripAt(clock: string) {
	let now = dayAndTime(clock)
	let schedule = getScheduleForNow(buildBusSchedules(now), now)
	let {status, index} = getCurrentBusIteration(schedule, now)
	return buildStopStrip({schedule, busStatus: status, departureIndex: index, now})
}

test('names every stop on the route, in order', () => {
	let {cells} = stripAt('Mo 1:02pm')
	expect(cells.map((cell) => cell.name)).toStrictEqual(['St. Olaf', 'Carleton', 'Third'])
})

test('marks the stops the bus has left as passed and those ahead as upcoming', () => {
	let {cells} = stripAt('Mo 1:02pm')
	expect(cells.map((cell) => cell.stopStatus)).toStrictEqual(['after', 'before', 'before'])
})

test('points at the first stop still ahead of the bus', () => {
	let {currentIndex} = stripAt('Mo 1:02pm')
	expect(currentIndex).toBe(1)
})

test('points at the stop the bus is sitting on', () => {
	let {cells, currentIndex} = stripAt('Mo 1:05pm')
	expect(cells[1]?.stopStatus).toBe('at')
	expect(currentIndex).toBe(1)
})

test('shows the round a skipped stop is skipped in as having no time', () => {
	let {cells} = stripAt('Mo 2:02pm')
	expect(cells[1]?.time).toBeNull()
	expect(cells[1]?.stopStatus).toBe('skip')
})

test('shows the first round before the bus has started for the day', () => {
	let {cells, currentIndex} = stripAt('Mo 12:00pm')
	expect(cells.map((cell) => cell.stopStatus)).toStrictEqual(['before', 'before', 'before'])
	expect(currentIndex).toBe(0)
})

test('shows the last round once the bus is done for the day', () => {
	let {cells, currentIndex} = stripAt('Mo 11:00pm')
	expect(cells.map((cell) => cell.stopStatus)).toStrictEqual(['after', 'after', 'after'])
	expect(currentIndex).toBeNull()
})

test('returns nothing at all for a day the line does not run', () => {
	let now = dayAndTime('We 1:02pm')
	let schedule = getScheduleForNow(buildBusSchedules(now), now)
	let {status, index} = getCurrentBusIteration(schedule, now)
	let {cells, currentIndex} = buildStopStrip({
		schedule,
		busStatus: status,
		departureIndex: index,
		now,
	})
	expect(cells).toStrictEqual([])
	expect(currentIndex).toBeNull()
})
