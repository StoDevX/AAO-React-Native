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

test('names the start of the round after the one on screen', () => {
	// 1:02pm is inside round 1 (1:00pm), so the next round is round 2 at 2:00pm.
	let {nextRoundStart} = stripAt('Mo 1:02pm')
	expect(nextRoundStart?.format('h:mma')).toBe('2:00pm')
})

test('names the next round while the bus waits between rounds', () => {
	// 1:30pm is after round 1 finishes (1:10pm) and before round 2 starts, so
	// the strip shows round 2 and the faux stop names round 3.
	let {nextRoundStart} = stripAt('Mo 1:30pm')
	expect(nextRoundStart?.format('h:mma')).toBe('3:00pm')
})

test('names the second round before the bus has started for the day', () => {
	let {nextRoundStart} = stripAt('Mo 12:00pm')
	expect(nextRoundStart?.format('h:mma')).toBe('2:00pm')
})

test('names no next round on the final round of the day', () => {
	let {nextRoundStart} = stripAt('Mo 3:02pm')
	expect(nextRoundStart).toBeNull()
})

test('names no next round once the bus is done for the day', () => {
	let {nextRoundStart} = stripAt('Mo 11:00pm')
	expect(nextRoundStart).toBeNull()
})

test('names no next round for a day the line does not run', () => {
	let now = dayAndTime('We 1:02pm')
	let schedule = getScheduleForNow(buildBusSchedules(now), now)
	let {status, index} = getCurrentBusIteration(schedule, now)
	let {nextRoundStart} = buildStopStrip({
		schedule,
		busStatus: status,
		departureIndex: index,
		now,
	})
	expect(nextRoundStart).toBeNull()
})
