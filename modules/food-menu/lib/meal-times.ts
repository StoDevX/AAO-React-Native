import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import {formatCompactTimeRange} from '@frogpond/time-format'

// Both spellings of the hour: BonApp pads it ("07:15") while our own fallback
// menus do not ("0:00"), and strict parsing accepts a format only for the
// spelling it names. `24:00` is a real answer too, and parses to the following
// midnight.
const TIME_FORMATS = ['H:mm', 'HH:mm']

/** Minutes in a day, less the one `23:59` stops short of. */
const WHOLE_DAY = 24 * 60 - 1

/** Minutes into the day `m` reads on its own clock, which is the campus's. */
function clockMinutes(m: moment.Moment): number {
	return m.hours() * 60 + m.minutes()
}

/** Just enough of a meal to say when it is served. */
type MealWindow = {
	starttime: string
	endtime: string
}

/**
 * When a meal opens and closes, or `null` for a meal whose times say nothing
 * -- see `formatMealTimes` for which those are. A window crossing midnight
 * closes the following day.
 *
 * `date` (`YYYY-MM-DD`) is the day the meal is served; left out, the times are
 * read against today.
 */
export function mealWindow(
	meal: MealWindow,
	date?: string,
): {start: moment.Moment; end: moment.Moment} | null {
	let formats = date ? TIME_FORMATS.map((format) => `YYYY-MM-DD ${format}`) : TIME_FORMATS
	let stamp = (time: string) => (date ? `${date} ${time}` : time)
	let start = moment.tz(stamp(meal.starttime), formats, true, timezone())
	let end = moment.tz(stamp(meal.endtime), formats, true, timezone())

	if (!start.isValid() || !end.isValid()) {
		return null
	}

	// Measured on the clock rather than in elapsed time: the days the clocks
	// change are an hour short or long, which would put a whole day under
	// `WHOLE_DAY` and a real window over it. `24:00` parses to the following
	// midnight, so it reads as the day's last minute and one more.
	let from = clockMinutes(start)
	let to = end.isSame(start, 'day') ? clockMinutes(end) : clockMinutes(end) + 24 * 60
	if (from === to || (from === 0 && to >= WHOLE_DAY)) {
		return null
	}

	// Earlier on the clock where the window crosses midnight, which is a real
	// window -- Sayles' Late Night -- rather than one of the empty ones.
	if (to < from) {
		end.add(1, 'day')
	}

	return {start, end}
}

/**
 * The window a meal is served, e.g. `7:15AM – 9:45AM`, or `null` for a meal
 * whose times say nothing.
 *
 * A window covering the whole day is one of those: `DEFAULT_MENU` in
 * `menu-bonapp.tsx` stands one up in place of dayparts BonApp did not publish,
 * and BonApp writes its own (`00:00` to `24:00`) for a cafe that is shut. The
 * two are recognised by what they cover rather than by how they are spelled --
 * read on a clock two hours behind campus, BonApp's spelling puts both ends on
 * the same reading and prints `10PM – 10PM`. A window with no duration says as
 * little.
 *
 * The times are clock readings on the campus's own clock, rendered in the
 * reader's -- the same conversion `formatBuildingTimes` makes, so a cafe's
 * hours and a building's agree for a reader away from campus.
 *
 * Takes no `now`: a time-only string parses against today already, and a
 * meal's window reads the same all day.
 */
export function formatMealTimes(meal: MealWindow, locale?: string): string | null {
	let window = mealWindow(meal)
	return window ? formatCompactTimeRange(window.start, window.end, locale) : null
}
