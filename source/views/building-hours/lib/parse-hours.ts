import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {timezone} from '@frogpond/constants'

import {TIME_FORMAT} from './constants'

type HourPairType = {open: Moment; close: Moment}

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

export function parseHours(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): HourPairType {
	let {from: fromTime, to: toTime} = schedule

	// Build the window that *starts* on m's own calendar day. If the close
	// time is at or before the open time, the schedule runs past midnight, so
	// the close belongs to the next day.
	let open = setTimeOnDay(m, fromTime)
	let close = setTimeOnDay(m, toTime)
	if (close.isBefore(open)) {
		close.add(1, 'day')
	}

	// A schedule that started *yesterday* can still be running now (e.g. a
	// 10:00pm–3:00am window, checked at 2:30am). Prefer that window when m
	// actually falls inside it. This replaces the old hard-coded "before 2am"
	// day shift, so any past-midnight close time is handled correctly.
	let prevOpen = open.clone().subtract(1, 'day')
	let prevClose = close.clone().subtract(1, 'day')
	if (m.isBetween(prevOpen, prevClose, 'minute', '[)')) {
		return {open: prevOpen, close: prevClose}
	}

	return {open, close}
}
