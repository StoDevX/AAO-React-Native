import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'
// The file rather than the package: the package's index loads native modules
// that Jest cannot.
import {isClosedLabel} from '@frogpond/food-menu/lib/closed'
import type {BonAppCafeDay} from '../types'
import type {CafeHours} from './cafe-hours'
import {oneWindowHours} from './cafe-hours'

/**
 * Both spellings of the hour, dated: BonApp pads it (`07:30`), and strict
 * parsing accepts a format only for the spelling it names.
 */
const STAMP_FORMATS = ['YYYY-MM-DD H:mm', 'YYYY-MM-DD HH:mm']

/**
 * The hours to put under a Bon Appétit cafe's name, read off its own published
 * dayparts, for a cafe serving one daypart today -- the Cage. `null` for every
 * other cafe, which keeps the line naming the meal and its window.
 *
 * Only a day dated today counts. ccc-server and React Query both cache the
 * cafe, so a response can outlive the day it describes, and another day's
 * hours say nothing about whether the cafe is open now.
 *
 * Bon Appétit publishes one day at a time, so a cafe past its one daypart is
 * taken to serve again tomorrow.
 */
export function daypartHours(days: BonAppCafeDay[] | undefined, m: Moment): CafeHours | null {
	let date = m.clone().tz(timezone()).format('YYYY-MM-DD')
	let today = days?.find((day) => day.date === date)
	if (!today) {
		return null
	}

	// A daypart labelled `Closed` is BonApp saying the cafe is shut, not a
	// window it serves in.
	let dayparts = today.dayparts.filter((daypart) => !isClosedLabel(daypart.label))
	if (dayparts.length !== 1) {
		return null
	}

	let [{starttime, endtime}] = dayparts
	let open = moment.tz(`${today.date} ${starttime}`, STAMP_FORMATS, true, timezone())
	let close = moment.tz(`${today.date} ${endtime}`, STAMP_FORMATS, true, timezone())
	if (!open.isValid() || !close.isValid()) {
		return null
	}

	// A daypart ending at or before it starts runs past midnight, like Sayles'
	// Late Night.
	if (!close.isAfter(open)) {
		close.add(1, 'day')
	}

	return oneWindowHours({open, close}, m, undefined)
}
