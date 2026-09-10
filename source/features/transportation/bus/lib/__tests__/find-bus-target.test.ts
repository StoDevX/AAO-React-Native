import {expect, test} from '@jest/globals'
import {findBusTarget} from '../find-bus-target'
import {processBusSchedule} from '../process-bus-line'
import {time} from './moment.helper'
import type {BusSchedule, UnprocessedBusSchedule} from '../../types'
import type {Moment} from 'moment-timezone'

function buildSchedule(now: Moment): BusSchedule {
	// prettier-ignore
	let schedule: UnprocessedBusSchedule = {
		days: ['Mo'],
		coordinates: {},
		stops: ['St. Olaf', 'Carleton', 'Food Co-op'],
		times: [['1:00pm', '1:10pm', '1:20pm'],
		        ['2:00pm', '2:10pm', '2:20pm'],
		],
	}
	return processBusSchedule(now)(schedule)
}

test('parks the bus at the last stop of the round that just ended', () => {
	let now = time('1:40pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(
		schedule,
		{status: 'between-rounds', index: 1, parkedStopIndex: 2},
		now,
	)
	expect(actual).toEqual({targetIndex: 2, progress: 1, atStop: true})
})

test('puts the bus at a stop when the clock matches its departure', () => {
	let now = time('1:10pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(schedule, {status: 'running', index: 0, parkedStopIndex: null}, now)
	expect(actual).toEqual({targetIndex: 1, progress: 1, atStop: true})
})

test('puts the bus partway along the leg it is driving', () => {
	let now = time('1:15pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(schedule, {status: 'running', index: 0, parkedStopIndex: null}, now)
	expect(actual).toEqual({targetIndex: 2, progress: 0.5, atStop: false})
})

test('draws no bus before the day starts', () => {
	let now = time('12:00pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(
		schedule,
		{status: 'before-start', index: null, parkedStopIndex: null},
		now,
	)
	expect(actual).toBe(null)
})

test('draws no bus once the day is over', () => {
	let now = time('5:00pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(
		schedule,
		{status: 'after-end', index: null, parkedStopIndex: null},
		now,
	)
	expect(actual).toBe(null)
})
