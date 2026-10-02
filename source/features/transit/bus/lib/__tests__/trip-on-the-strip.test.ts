import {describe, expect, test} from '@jest/globals'

import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {tripOnTheStrip} from '../trip-on-the-strip'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusSchedule} from '../../types'

function stripAt(raw: UnprocessedBusSchedule, clock: string, {milliseconds = 0} = {}) {
	let now = dayAndTime(clock).milliseconds(milliseconds)
	let schedule = processBusSchedule(now)(raw)
	let iteration = getCurrentBusIteration(schedule, now)
	return tripOnTheStrip(schedule, iteration, now)
}

/** Two trips on a loop: each ends at the Depot the next begins from. */
// prettier-ignore
const LOOP: UnprocessedBusSchedule = {
	days: ['Mo'],
	coordinates: {},
	stops: ['Depot', 'Library', 'Depot'],
	times: [['1:00pm', '1:05pm', '1:10pm'],
	        ['1:20pm', '1:25pm', '1:30pm']],
}

/**
 * The Express's shape: a loop that calls at its first two stops twice, where
 * every trip but the last skips the second call at St. Olaf.
 */
// prettier-ignore
const EXPRESS: UnprocessedBusSchedule = {
	days: ['Mo'],
	coordinates: {},
	stops: ['Carleton', 'St. Olaf', 'Co-op', 'Carleton', 'St. Olaf'],
	times: [['1:00pm', '1:08pm', '1:15pm', '1:38pm', false],
	        ['1:45pm', '1:53pm', '2:00pm', '2:23pm', '2:30pm']],
}

describe('tripOnTheStrip', () => {
	test('on the move, shows the trip the bus is on', () => {
		expect(stripAt(LOOP, 'Mo 1:22pm')).toStrictEqual({
			departureIndex: 1,
			busTarget: {targetIndex: 1, progress: 0.4, atStop: false},
		})
	})

	test('between trips, shows the trip just finished with the bus parked at its end', () => {
		expect(stripAt(LOOP, 'Mo 1:15pm')).toStrictEqual({
			departureIndex: 0,
			busTarget: {targetIndex: 2, progress: 1, atStop: true},
		})
	})

	test('parks the bus where the trip ended, not at a later stop the trip skipped', () => {
		expect(stripAt(EXPRESS, 'Mo 1:40pm')).toStrictEqual({
			departureIndex: 0,
			busTarget: {targetIndex: 3, progress: 1, atStop: true},
		})
	})

	test('keeps the bus at the end from the first moment after it arrives', () => {
		// The screen's clock ticks a few milliseconds into each minute, so the
		// gap between trips begins then rather than a minute later.
		expect(stripAt(LOOP, 'Mo 1:10pm', {milliseconds: 5})).toStrictEqual({
			departureIndex: 0,
			busTarget: {targetIndex: 2, progress: 1, atStop: true},
		})
	})
})
