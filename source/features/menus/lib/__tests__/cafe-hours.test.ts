import {describe, expect, test} from '@jest/globals'

import type {BuildingType} from '../../../building-hours/types'
import {cafeHours} from '../cafe-hours'
import {dayMoment} from '../../../building-hours/lib/__tests__/moment.helper'

/** The Pause Kitchen as `data/building-hours/1-2-pause-kitchen.yaml` has it. */
const PAUSE: BuildingType = {
	name: 'The Pause Kitchen',
	category: 'Food',
	schedule: [
		{
			title: 'Hours',
			hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '4:00pm', to: '12:00am'}],
		},
	],
	breakSchedule: {},
}

describe('cafeHours', () => {
	test('gives the window the venue is serving', () => {
		expect(cafeHours(PAUSE, dayMoment('Fri 6:00pm'))).toEqual({
			time: '4PM – Midnight',
			closed: false,
		})
	})

	// The hours stay true when the doors are shut, but the header has a way of
	// saying shut already -- the cafe's name standing alone -- and that is what
	// a closed Bon Appétit cafe does too.
	test('reports a venue that is not serving as closed', () => {
		expect(cafeHours(PAUSE, dayMoment('Fri 9:00am'))).toEqual({time: null, closed: true})
	})

	// The menu screen draws before the buildings query resolves, and a venue
	// that has not arrived is not a venue that is shut.
	test('says nothing about a venue it has not been given', () => {
		expect(cafeHours(undefined, dayMoment('Fri 6:00pm'))).toEqual({time: null, closed: false})
	})

	test('reports a venue publishing no hours at all as closed', () => {
		let unscheduled: BuildingType = {...PAUSE, schedule: []}
		expect(cafeHours(unscheduled, dayMoment('Fri 6:00pm'))).toEqual({time: null, closed: true})
	})

	// The Pause shuts *at* midnight rather than past it, so the small hours are
	// the one time its flat every-day schedule is not serving.
	test('reports the venue shut once its window has closed at midnight', () => {
		expect(cafeHours(PAUSE, dayMoment('Sat 12:30am'))).toEqual({time: null, closed: true})
	})

	// A venue that does run past midnight keeps last night's window rather than
	// reading as tonight's not-yet-started one.
	test('keeps a window that is still running after midnight', () => {
		let lateNight: BuildingType = {
			...PAUSE,
			schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '9:00pm', to: '2:00am'}]}],
		}

		expect(cafeHours(lateNight, dayMoment('Sat 1:00am'))).toEqual({
			time: '9PM – 2AM',
			closed: false,
		})
	})
})
