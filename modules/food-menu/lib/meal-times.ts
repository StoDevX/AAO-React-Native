import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import {formatCompactTime} from '@frogpond/time-format'

// Both spellings of the hour: BonApp pads it ("07:15") while our own fallback
// menus do not ("0:00"), and strict parsing accepts a format only for the
// spelling it names.
const TIME_FORMATS = ['H:mm', 'HH:mm']

/**
 * The whole day, which `DEFAULT_MENU` in `menu-bonapp.tsx` stands up in place
 * of the dayparts BonApp did not publish. Our own invention rather than a
 * window anyone is served in, so it is not a window to print.
 */
const ALL_DAY = {starttime: '0:00', endtime: '23:59'}

/** Just enough of a meal to say when it is served. */
type MealWindow = {
	starttime: string
	endtime: string
}

/**
 * The window a meal is served, e.g. `7:15AM–9:45AM`, or `null` for a meal
 * whose times BonApp did not give us.
 *
 * The times are clock readings on the campus's own clock, rendered in the
 * reader's -- the same conversion `formatBuildingTimes` makes, so a cafe's
 * hours and a building's agree for a reader away from campus.
 *
 * Takes no `now`: a time-only string parses against today already, and the
 * screens above build a fresh `Moment` on every render, so a window depending
 * on one would republish the navigation bar's header on every render and loop
 * through the provider's state.
 */
export function formatMealTimes(meal: MealWindow, locale?: string): string | null {
	let {starttime, endtime} = meal

	if (starttime === ALL_DAY.starttime && endtime === ALL_DAY.endtime) {
		return null
	}

	let start = moment.tz(starttime, TIME_FORMATS, true, timezone())
	let end = moment.tz(endtime, TIME_FORMATS, true, timezone())

	if (!start.isValid() || !end.isValid()) {
		return null
	}

	return `${formatCompactTime(start, locale)}–${formatCompactTime(end, locale)}`
}
