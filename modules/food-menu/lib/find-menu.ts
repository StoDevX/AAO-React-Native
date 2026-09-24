import type {Moment} from 'moment'
import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import type {DayPartMenuType, DayPartsCollectionType, ProcessedMealType} from '../types'

const TIME_FORMATS = ['H:mm', 'HH:mm']

export function findMenu(dayparts: DayPartsCollectionType, now: Moment): void | DayPartMenuType {
	// `dayparts` is, conceptually, a collection of bonapp menus for a
	// location. It's a single-element array of arrays, so we first check
	// to see if either dimension is empty.
	if (dayparts.length === 0 || dayparts[0].length === 0) {
		return
	}

	// Now that we know they're not empty, we grab the single element out of
	// the top array for easier use.
	const daypart = dayparts[0]

	const menuIndex = findMenuIndex(daypart, now)
	return daypart[menuIndex]
}

export function findMeal(meals: ProcessedMealType[], now: Moment): ProcessedMealType | undefined {
	if (meals.length === 0) {
		return
	}

	const dayparts: DayPartMenuType[] = meals.map((m) => ({
		starttime: m.starttime,
		endtime: m.endtime,
		label: m.label,
		stations: m.stations,
		id: m.label,
		abbreviation: m.label,
	}))

	const mealIndex = findMenuIndex(dayparts, now)
	return meals[mealIndex]
}

function findMenuIndex(dayparts: DayPartMenuType[], now: Moment): number {
	// If there's only a single bonapp menu for this location (think the Cage,
	// instead of the Caf), we just return that item.
	if (dayparts.length === 1) {
		return 0
	}

	// Otherwise, we make ourselves a list of {starttime, endtime} pairs so we
	// can query times relative to `now`. Also make sure to set dayOfYear to
	// `now`, so that we don't have our days wandering all over the place.
	// Both spellings of the hour: BonApp pads it ("07:15") while our own
	// fallback menus do not ("0:00"), and strict parsing accepts a format
	// only for the spelling it names.
	const times = dayparts.map(({starttime, endtime}) => ({
		start: moment.tz(starttime, TIME_FORMATS, true, timezone()).dayOfYear(now.dayOfYear()),
		end: moment.tz(endtime, TIME_FORMATS, true, timezone()).dayOfYear(now.dayOfYear()),
	}))

	// A meal's end is the minute it stops being served, so where one meal's end
	// is the next one's start, that minute belongs to the meal coming in rather
	// than the one going out. BonApp lists dayparts in no particular order, and
	// Weitz Center's café opens hours before the lunch it is listed after, so
	// each rule below reads the times rather than the order.
	const indices = times.map((_, index) => index)

	// A meal being served now. Where two are, the one ending first, and of two
	// that end together, the one that opened later: Weitz's lunch, not the
	// café that has been open all morning.
	const open = indices.filter((i) => !now.isBefore(times[i].start) && now.isBefore(times[i].end))
	if (open.length > 0) {
		return open.reduce((best, i) => {
			const {start, end} = times[i]
			if (end.isBefore(times[best].end)) {
				return i
			}
			if (end.isSame(times[best].end) && start.isAfter(times[best].start)) {
				return i
			}
			return best
		})
	}

	// Otherwise the next meal to open.
	const upcoming = indices.filter((i) => now.isBefore(times[i].start))
	if (upcoming.length > 0) {
		return upcoming.reduce((best, i) => (times[i].start.isBefore(times[best].start) ? i : best))
	}

	// Otherwise we are after the last meal of the day, so we return the last
	// one. The only time this really fails is in the early morning, if it's
	// like 1am and you're wondering what there was at dinner.
	return times.length - 1
}
