import {expect, test} from '@jest/globals'

import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {tripOnTheStrip} from '../trip-on-the-strip'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusSchedule} from '../../types'

/**
 * Two trips a day. The first ends where the second begins, the way every
 * route the app shows runs; `endsElsewhere` swaps the last stop so it does not.
 */
function stripAt(clock: string, {endsElsewhere = false} = {}) {
	let now = dayAndTime(clock)
	// prettier-ignore
	let raw: UnprocessedBusSchedule = {
		days: ['Mo'],
		coordinates: {},
		stops: ['Depot', 'Library', endsElsewhere ? 'Elsewhere' : 'Depot'],
		times: [['1:00pm', '1:05pm', '1:10pm'],
		        ['1:20pm', '1:25pm', '1:30pm']],
	}
	let schedule = processBusSchedule(now)(raw)
	let iteration = getCurrentBusIteration(schedule, now)
	return tripOnTheStrip(schedule, iteration, now)
}

test('between trips on a loop, waits at the start of the next trip', () => {
	expect(stripAt('Mo 1:15pm')).toStrictEqual({
		departureIndex: 1,
		busTarget: {targetIndex: 0, progress: 1, atStop: true},
	})
})

test('between trips on a route that does not loop, shows the trip that just ended', () => {
	expect(stripAt('Mo 1:15pm', {endsElsewhere: true})).toStrictEqual({
		departureIndex: 0,
		busTarget: {targetIndex: 2, progress: 1, atStop: true},
	})
})

test('on the move, shows the trip the bus is on', () => {
	expect(stripAt('Mo 1:22pm')).toStrictEqual({
		departureIndex: 1,
		busTarget: {targetIndex: 1, progress: 0.4, atStop: false},
	})
})
