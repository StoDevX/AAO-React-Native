import type {Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'
// The files rather than the package: the package's index loads native modules
// that Jest cannot.
import {isClosedLabel} from '@frogpond/food-menu/lib/closed'
import {mealWindow} from '@frogpond/food-menu/lib/meal-times'
import type {BonAppCafeDay} from '../types'
import type {CafeHours} from './cafe-hours'
import {oneWindowHours} from './cafe-hours'

/** The line for a day Bon Appétit marks closed, in every shut cafe's words. */
const CLOSED_TODAY: CafeHours = {time: null, closed: true, reopening: 'Closed'}

/**
 * The hours to put under a Bon Appétit cafe's name, read off its own published
 * dayparts, for a cafe serving one daypart today -- the Cage -- or `Closed` for
 * a day Bon Appétit marks closed. `null` for every other cafe, which keeps the
 * line naming the meal and its window.
 *
 * Only a day dated today counts. ccc-server and React Query both cache the
 * cafe, so a response can outlive the day it describes, and another day's
 * hours say nothing about whether the cafe is open now.
 *
 * Bon Appétit publishes one day at a time, so a cafe past its one daypart
 * says only that it is closed: whether it serves tomorrow is not in the data.
 */
export function daypartHours(days: BonAppCafeDay[] | undefined, m: Moment): CafeHours | null {
	let date = m.clone().tz(timezone()).format('YYYY-MM-DD')
	let today = days?.find((day) => day.date === date)
	if (!today) {
		return null
	}

	// The flag the cafe message also reads, so the name and the body agree. Not
	// the message's other sign, a day with no dayparts: ccc-server answers with
	// that when fetching the cafe failed too, while the menu beside it can be
	// full.
	if (today.status === 'closed') {
		return CLOSED_TODAY
	}

	// A daypart labelled `Closed` is BonApp saying the cafe is shut, not a
	// window it serves in.
	let dayparts = today.dayparts.filter((daypart) => !isClosedLabel(daypart.label))
	if (dayparts.length !== 1) {
		return null
	}

	let window = mealWindow(dayparts[0], today.date)
	if (!window) {
		return null
	}

	// A daypart running past midnight also ran last night, and last night's is
	// not in a day that holds only today's -- so in the small hours before it
	// would have closed, whether the cafe is serving is not something this day
	// can answer.
	if (m.isBefore(window.end.clone().subtract(1, 'day'))) {
		return null
	}

	return oneWindowHours({open: window.start, close: window.end}, m)
}
