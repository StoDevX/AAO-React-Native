import {describe, expect, test} from '@jest/globals'
import {busPropsForCell, busPropsForRow, findBusTarget} from '../find-bus-target'
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

test('draws no bus once the day is over, whatever the clock says', () => {
	// The status decides whether a bus is on the line at all, so a day that has
	// finished draws nothing even when `now` falls inside one of its rounds.
	let now = time('1:05pm')
	let schedule = buildSchedule(now)
	let actual = findBusTarget(schedule, {status: 'after-end', index: 0, parkedStopIndex: null}, now)
	expect(actual).toBe(null)
})

describe('busPropsForRow', () => {
	test('gives the bus to both stops either side of the leg', () => {
		let target = {targetIndex: 2, progress: 0.25, atStop: false}
		expect(busPropsForRow(target, 1)).toStrictEqual({busFraction: 0.25})
		expect(busPropsForRow(target, 2)).toStrictEqual({busFraction: -0.75})
	})

	test('gives a parked bus to the stop it is parked at, alone', () => {
		let target = {targetIndex: 2, progress: 1, atStop: true}
		expect(busPropsForRow(target, 2)).toStrictEqual({busAtStop: true})
		expect(busPropsForRow(target, 1)).toStrictEqual({})
	})

	test('gives nothing to a stop the bus is nowhere near', () => {
		expect(busPropsForRow({targetIndex: 2, progress: 0.25, atStop: false}, 0)).toStrictEqual({})
	})

	test('gives nothing at all when no bus is on the route', () => {
		expect(busPropsForRow(null, 0)).toStrictEqual({})
	})
})

describe('busPropsForCell', () => {
	test('gives the bus to the stop it left while it is the nearer one', () => {
		let target = {targetIndex: 2, progress: 0.25, atStop: false}
		expect(busPropsForCell(target, 1)).toStrictEqual({busFraction: 0.25})
		expect(busPropsForCell(target, 2)).toStrictEqual({})
	})

	test('hands the bus over to the stop ahead once that one is nearer', () => {
		let target = {targetIndex: 2, progress: 0.75, atStop: false}
		expect(busPropsForCell(target, 1)).toStrictEqual({})
		expect(busPropsForCell(target, 2)).toStrictEqual({busFraction: -0.25})
	})

	test('draws the bus once at the midpoint of a leg, not twice', () => {
		let target = {targetIndex: 2, progress: 0.5, atStop: false}
		let drawn = [0, 1, 2].filter((index) => busPropsForCell(target, index).busFraction != null)
		expect(drawn).toStrictEqual([2])
	})

	test('gives a parked bus to the stop it is parked at, same as a row', () => {
		let target = {targetIndex: 2, progress: 1, atStop: true}
		expect(busPropsForCell(target, 2)).toStrictEqual({busAtStop: true})
		expect(busPropsForCell(target, 1)).toStrictEqual({})
	})

	test('gives nothing at all when no bus is on the route', () => {
		expect(busPropsForCell(null, 0)).toStrictEqual({})
	})
})
