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

/** A venue serving twice on Fridays, which keeps the window-by-window line. */
const TWICE_DAILY: BuildingType = {
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

describe('cafeHours', () => {
	// The menu screen draws before the buildings query resolves, and a venue
	// that has not arrived is not a venue that is shut.
	test('says nothing about a venue it has not been given', () => {
		expect(cafeHours(undefined, dayMoment('Fri 6:00pm'))).toEqual({
			time: null,
			closed: false,
			reopening: null,
		})
	})

	test('reports a venue publishing no hours at all as closed', () => {
		let unscheduled: BuildingType = {...PAUSE, schedule: []}
		expect(cafeHours(unscheduled, dayMoment('Fri 6:00pm'))).toEqual({
			time: null,
			closed: true,
			reopening: 'Closed',
		})
	})

	// With one window in the day there is one thing worth knowing at a time:
	// when it opens, then when it closes.
	describe('a venue with one window today', () => {
		test('says when it opens, before it does', () => {
			expect(cafeHours(PAUSE, dayMoment('Fri 9:00am'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Opens at 4 PM',
			})
		})

		// Half an hour out the status reads `Almost Open`, but the doors are
		// still shut.
		test('still says when it opens, just before it does', () => {
			expect(cafeHours(PAUSE, dayMoment('Fri 3:45pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Opens at 4 PM',
			})
		})

		test('says when it closes, while it is open', () => {
			expect(cafeHours(PAUSE, dayMoment('Fri 6:00pm'))).toEqual({
				time: 'Closes at midnight',
				closed: false,
				reopening: null,
			})
			expect(cafeHours(PAUSE, dayMoment('Fri 11:45pm'))).toEqual({
				time: 'Closes at midnight',
				closed: false,
				reopening: null,
			})
		})

		// The Pause shuts *at* midnight, so the small hours are already the next
		// day, and its one window is still ahead.
		test('says when it opens, once a midnight close has passed', () => {
			expect(cafeHours(PAUSE, dayMoment('Sat 12:30am'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Opens at 4 PM',
			})
		})

		test('says it is closed until tomorrow, after closing early', () => {
			let lunchOnly: BuildingType = {
				...PAUSE,
				schedule: [
					{
						title: 'Hours',
						hours: [
							{days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], from: '11:00am', to: '2:00pm'},
						],
					},
				],
			}

			expect(cafeHours(lunchOnly, dayMoment('Fri 3:00pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Closed until tomorrow',
			})
		})

		// "Tomorrow" is a promise; a venue with nothing tomorrow cannot make it.
		test('says only that it is closed, when nothing opens tomorrow', () => {
			let fridayLunch: BuildingType = {
				...PAUSE,
				schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '11:00am', to: '2:00pm'}]}],
			}

			expect(cafeHours(fridayLunch, dayMoment('Fri 3:00pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Closed',
			})
		})

		test('writes noon as a word', () => {
			let fromNoon: BuildingType = {
				...PAUSE,
				schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '12:00pm', to: '2:00pm'}]}],
			}

			expect(cafeHours(fromNoon, dayMoment('Fri 9:00am')).reopening).toBe('Opens at noon')
		})

		// Last night's window is the one running, and today's own has not
		// started, so the day holds one window at a time.
		test('says when a window from last night closes', () => {
			let lateNight: BuildingType = {
				...PAUSE,
				schedule: [{title: 'Hours', hours: [{days: ['Fr'], from: '9:00pm', to: '2:00am'}]}],
			}

			expect(cafeHours(lateNight, dayMoment('Sat 1:00am'))).toEqual({
				time: 'Closes at 2 AM',
				closed: false,
				reopening: null,
			})
		})

		// `isPhysicallyOpen: false` is the college saying the doors are shut
		// whatever the hours beside them read, so that set's window is not one of
		// the day's.
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

			expect(cafeHours(shuttered, dayMoment('Fri 1:00pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Opens at 5 PM',
			})
			expect(cafeHours(shuttered, dayMoment('Fri 6:00pm'))).toEqual({
				time: 'Closes at 9 PM',
				closed: false,
				reopening: null,
			})
		})
	})

	describe('a venue with more than one window today', () => {
		// A venue serving twice a day publishes both windows on the same day, and
		// `schedulesInEffect` hands back both. The one running is the one to draw.
		test('draws the window it is running, not the first one it published', () => {
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 6:00pm'))).toEqual({
				time: '5PM – 9PM',
				closed: false,
				reopening: null,
			})
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 1:00pm'))).toEqual({
				time: '7AM – 2PM',
				closed: false,
				reopening: null,
			})
		})

		// Half an hour out from opening it reads as `Almost Open`, which is when
		// the window is worth reading. The window to read is the one about to
		// start -- this morning's service is over by then.
		test('draws the window about to open, not the one already finished', () => {
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 4:40pm'))).toEqual({
				time: '5PM – 9PM',
				closed: false,
				reopening: null,
			})
		})

		test('says when it opens again, between windows', () => {
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 3:00pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Closed until 5 PM',
			})
		})

		// Past its last window it says it is shut, as a venue with one window
		// does, rather than leaving the name standing alone.
		test('says only that it is closed once nothing opens again today', () => {
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 10:00pm'))).toEqual({
				time: null,
				closed: true,
				reopening: 'Closed',
			})
		})

		// Half an hour out from closing it reads as `Almost Closed`, which is a
		// venue that is still serving.
		test('keeps a venue that is about to close open', () => {
			expect(cafeHours(TWICE_DAILY, dayMoment('Fri 8:45pm'))).toEqual({
				time: '5PM – 9PM',
				closed: false,
				reopening: null,
			})
		})

		// Last night's window is running and tonight's is ahead, so the day holds
		// two, and the one to draw is the one still running.
		test('draws a window still running from last night', () => {
			let lateNights: BuildingType = {
				...PAUSE,
				schedule: [
					{
						title: 'Hours',
						hours: [
							{days: ['Fr'], from: '9:00pm', to: '2:00am'},
							{days: ['Sa'], from: '11:00am', to: '2:00pm'},
						],
					},
				],
			}

			expect(cafeHours(lateNights, dayMoment('Sat 1:00am'))).toEqual({
				time: '9PM – 2AM',
				closed: false,
				reopening: null,
			})
		})

		// `isPhysicallyOpen: false` is the college saying the doors are shut
		// whatever the hours beside them read, so its window is not the one to
		// draw even while the status reads open.
		test('passes over a set whose doors are not open', () => {
			let shuttered: BuildingType = {
				...PAUSE,
				schedule: [
					{
						title: 'Closed for renovation',
						isPhysicallyOpen: false,
						hours: [{days: ['Fr'], from: '9:00am', to: '3:00pm'}],
					},
					{
						title: 'Hours',
						hours: [
							{days: ['Fr'], from: '7:00am', to: '11:00am'},
							{days: ['Fr'], from: '5:00pm', to: '9:00pm'},
						],
					},
				],
			}

			expect(cafeHours(shuttered, dayMoment('Fri 10:00am'))).toEqual({
				time: '7AM – 11AM',
				closed: false,
				reopening: null,
			})
		})
	})

	// A window that ends while chapel has the doors shut does not reopen after
	// it, so the status reads `Closed` rather than `Chapel` -- and the window
	// is not one the venue is serving in.
	test('reports a window cut short by chapel as closed', () => {
		let endsInChapel: BuildingType = {
			...PAUSE,
			schedule: [
				{
					title: 'Hours',
					closedForChapelTime: true,
					hours: [{days: ['Mo'], from: '8:00am', to: '10:20am'}],
				},
			],
		}

		expect(cafeHours(endsInChapel, dayMoment('Mon 10:15am'))).toEqual({
			time: null,
			closed: true,
			reopening: 'Closed',
		})
	})

	// Chapel shuts the doors too. `getShortBuildingStatus` names it rather than
	// calling it closed, which is a distinction a menu header has no room for.
	test('reports a venue shut for chapel as closed until chapel ends', () => {
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
			reopening: 'Closed until 10:30 AM',
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
