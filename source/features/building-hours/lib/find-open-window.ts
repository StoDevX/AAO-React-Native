import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {timezone} from '@frogpond/constants'

import {getDayOfWeek} from './get-day-of-week'
import {TIME_FORMAT} from './constants'

export type HourPairType = {open: Moment; close: Moment}

// Anchor a "h:mma" time string onto the calendar day of `base`, keeping
// `base`'s timezone/date and only replacing the time-of-day.
function setTimeOnDay(base: Moment, time: string): Moment {
	let parsed = moment.tz(time, TIME_FORMAT, true, timezone())
	return base.clone().set({
		hour: parsed.hour(),
		minute: parsed.minute(),
		second: 0,
		millisecond: 0,
	})
}

/**
 * The window `schedule` describes for the day `anchor` falls on. A close time
 * at or before the open time means the window runs past midnight, so the close
 * belongs to the following day.
 */
export function windowOpeningOn(
	schedule: SingleBuildingScheduleType,
	anchor: Moment,
): HourPairType {
	let open = setTimeOnDay(anchor, schedule.from)
	let close = setTimeOnDay(anchor, schedule.to)
	if (close.isBefore(open)) {
		close.add(1, 'day')
	}
	return {open, close}
}

/**
 * The window `schedule` is running at `m`, or null if it is running none.
 *
 * A schedule's `days` name the day each window *opens*, not the day it ends, so
 * a 9:00pm–2:00am Friday window is still the one running at Saturday 1:00am.
 * Both the day `m` falls on and the day before it are candidates, and each is
 * only considered when `days` actually covers it -- otherwise a Friday-night
 * window would be read as running every night of the week. An empty `days`
 * means no day is excluded.
 */
export function findOpenWindow(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): HourPairType | null {
	for (let daysBack of [0, 1]) {
		let anchor = m.clone().subtract(daysBack, 'day')
		if (schedule.days.length && !schedule.days.includes(getDayOfWeek(anchor))) {
			continue
		}

		let window = windowOpeningOn(schedule, anchor)
		if (m.isBetween(window.open, window.close, 'minute', '[)')) {
			return window
		}
	}

	return null
}
