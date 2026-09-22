import {describe, expect, test} from '@jest/globals'

import bundledBuildings from '../../../../../docs/building-hours.json'
import type {BuildingType} from '../../../building-hours/types'
import {cafeHours, PAUSE_VENUE} from '../cafe-hours'
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
			opensAt: null,
		})
	})

	// The hours stay true when the doors are shut, but the header has a way of
	// saying shut already -- the cafe's name standing alone -- and that is what
	// a closed Bon Appétit cafe does too.
	test('reports a venue that is not serving as closed, and when it opens', () => {
		expect(cafeHours(PAUSE, dayMoment('Fri 9:00am'))).toEqual({
			time: null,
			closed: true,
			opensAt: '4PM',
		})
	})

	// The menu screen draws before the buildings query resolves, and a venue
	// that has not arrived is not a venue that is shut.
	test('says nothing about a venue it has not been given', () => {
		expect(cafeHours(undefined, dayMoment('Fri 6:00pm'))).toEqual({
			time: null,
			closed: false,
			opensAt: null,
		})
	})

	test('reports a venue publishing no hours at all as closed', () => {
		let unscheduled: BuildingType = {...PAUSE, schedule: []}
		expect(cafeHours(unscheduled, dayMoment('Fri 6:00pm'))).toEqual({
			time: null,
			closed: true,
			opensAt: null,
		})
	})

	// The Pause shuts *at* midnight rather than past it, so the small hours are
	// the one time its flat every-day schedule is not serving.
	test('reports the venue shut once its window has closed at midnight', () => {
		expect(cafeHours(PAUSE, dayMoment('Sat 12:30am'))).toEqual({
			time: null,
			closed: true,
			opensAt: '4PM',
		})
	})

	// Nothing ahead today is not the same as never: the header says shut and
	// stops, rather than naming a day it has no room for.
	test('names no opening once nothing opens again today', () => {
		let lunchOnly: BuildingType = {
			...PAUSE,
			schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '11:00am', to: '2:00pm'}]}],
		}

		expect(cafeHours(lunchOnly, dayMoment('Fri 3:00pm'))).toEqual({
			time: null,
			closed: true,
			opensAt: null,
		})
	})

	// Written the way the menu header writes its windows, so the opening reads
	// as a time from the same line of the bar.
	test('writes an opening at noon as Noon', () => {
		let fromNoon: BuildingType = {
			...PAUSE,
			schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '12:00pm', to: '2:00pm'}]}],
		}

		expect(cafeHours(fromNoon, dayMoment('Fri 9:00am')).opensAt).toBe('Noon')
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
			opensAt: null,
		})
	})
	// A venue serving twice a day publishes both windows on the same day, and
	// `schedulesInEffect` hands back both. The one running is the one to draw.
	test('draws the window it is running, not the first one it published', () => {
		let twiceDaily: BuildingType = {
			...PAUSE,
			schedule: [
				{
					title: 'Hours',
					hours: [
						{days: ['Fr'], from: '7:00am', to: '2:00pm'},
						{days: ['Fr'], from: '5:00pm', to: '9:00pm'},
					],
				},
			],
		}

		expect(cafeHours(twiceDaily, dayMoment('Fri 6:00pm'))).toEqual({
			time: '5PM – 9PM',
			closed: false,
			opensAt: null,
		})
		expect(cafeHours(twiceDaily, dayMoment('Fri 1:00pm'))).toEqual({
			time: '7AM – 2PM',
			closed: false,
			opensAt: null,
		})
	})

	// `isPhysicallyOpen: false` is the college saying the doors are shut whatever
	// the hours beside them read.
	test('passes over a set whose doors are not open', () => {
		let shuttered: BuildingType = {
			...PAUSE,
			schedule: [
				{
					title: 'Closed for renovation',
					isPhysicallyOpen: false,
					hours: [{days: ['Fr'], from: '7:00am', to: '2:00pm'}],
				},
				{title: 'Hours', hours: [{days: ['Fr'], from: '5:00pm', to: '9:00pm'}]},
			],
		}

		expect(cafeHours(shuttered, dayMoment('Fri 6:00pm'))).toEqual({
			time: '5PM – 9PM',
			closed: false,
			opensAt: null,
		})
		expect(cafeHours(shuttered, dayMoment('Fri 1:00pm'))).toEqual({
			time: null,
			closed: true,
			opensAt: '5PM',
		})
	})

	// Half an hour out from closing the venue reads as `Almost Closed`, which is
	// a venue that is still serving.
	test('keeps a venue that is about to close open', () => {
		expect(cafeHours(PAUSE, dayMoment('Fri 11:45pm'))).toEqual({
			time: '4PM – Midnight',
			closed: false,
			opensAt: null,
		})
	})

	// Half an hour out from opening it reads as `Almost Open`, which is when the
	// window is worth reading. The window to read is the one about to start, not
	// whichever the venue happened to publish first -- this morning's service is
	// over by then.
	test('draws the window about to open, not the one already finished', () => {
		let twiceDaily: BuildingType = {
			...PAUSE,
			schedule: [
				{
					title: 'Hours',
					hours: [
						{days: ['Fr'], from: '7:00am', to: '2:00pm'},
						{days: ['Fr'], from: '5:00pm', to: '9:00pm'},
					],
				},
			],
		}

		expect(cafeHours(twiceDaily, dayMoment('Fri 4:40pm'))).toEqual({
			time: '5PM – 9PM',
			closed: false,
			opensAt: null,
		})
	})

	// Chapel shuts the doors too. `getShortBuildingStatus` names it rather than
	// calling it closed, which is a distinction a menu header has no room for.
	test('reports a venue shut for chapel as closed', () => {
		let observesChapel: BuildingType = {
			...PAUSE,
			schedule: [
				{
					title: 'Hours',
					closedForChapelTime: true,
					hours: [{days: ['We'], from: '8:00am', to: '5:00pm'}],
				},
			],
		}

		expect(cafeHours(observesChapel, dayMoment('Wed 10:20am'))).toEqual({
			time: null,
			closed: true,
			opensAt: '10:30AM',
		})
	})
})

// The fixture above is a copy, so every test here would go on passing after a
// rename. This is the one that would not: `PAUSE_VENUE` is a key into a file
// the college maintains by hand, and the header loses its hours the moment it
// stops matching. The bundled copy is what the UI tests read, so it is the
// copy worth holding the constant against.
describe('PAUSE_VENUE', () => {
	test('names a venue the bundled building hours actually carry', () => {
		let names = (bundledBuildings as {data: BuildingType[]}).data.map((b) => b.name)
		expect(names).toContain(PAUSE_VENUE)
	})
})
