import {expect, test} from '@jest/globals'
import {findBusStopStatus} from '../find-bus-stop-status'
import {findBusTarget} from '../find-bus-target'
import {getCurrentBusIteration} from '../get-current-bus-iteration'
import {processBusSchedule} from '../process-bus-line'
import {time} from './moment.helper'
import type {BusSchedule, UnprocessedBusSchedule} from '../../types'
import type {Moment} from 'moment-timezone'

function buildSchedule(now: Moment): BusSchedule {
	// prettier-ignore
	let schedule: UnprocessedBusSchedule = {
		days: ['Mo'],
		coordinates: {},
		stops: ['St. Olaf', 'Carleton', 'St. Olaf'],
		times: [['1:00pm', '1:10pm', '1:20pm'],
		        ['2:00pm', '2:10pm', '2:20pm'],
		],
	}
	return processBusSchedule(now)(schedule)
}

/** What each row of the line would draw at `now`, in order. */
function rowStatuses(now: Moment) {
	let schedule = buildSchedule(now)
	let {status, index, parkedStopIndex} = getCurrentBusIteration(schedule, now)
	let busTarget = findBusTarget(schedule, {status, index, parkedStopIndex}, now)

	return schedule.timetable.map((stop, i) => {
		let busAtStop = busTarget?.atStop === true && busTarget.targetIndex === i
		return findBusStopStatus({stop, busStatus: status, departureIndex: index, now, busAtStop})
	})
}

test('leaves the bus at the end of the line until the next round departs', () => {
	expect(rowStatuses(time('1:20pm'))).toEqual(['after', 'after', 'at'])
	expect(rowStatuses(time('1:40pm'))).toEqual(['before', 'before', 'at'])
	expect(rowStatuses(time('1:59pm'))).toEqual(['before', 'before', 'at'])
})

test('sends the bus back out when the next round departs', () => {
	expect(rowStatuses(time('2:00pm'))).toEqual(['at', 'before', 'before'])
})
