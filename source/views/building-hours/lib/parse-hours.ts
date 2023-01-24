import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {timezone} from '@frogpond/constants'

import {TIME_FORMAT} from './constants'

type HourPairType = {open: Moment; close: Moment}

// TODO: Do "dayOfYear" handling better so that we don't need to handle wrapping at
// the 6 month mark. (See #3375 for why this function changed.)
export function parseHours(
	{from: fromTime, to: toTime}: SingleBuildingScheduleType,
	m: Moment,
): HourPairType {
	let dayOfYear = m.dayOfYear()

	// if the moment is before 3am
	if (m.hour() < 2) {
		dayOfYear -= 1
	}

	let open = moment.tz(fromTime, TIME_FORMAT, true, timezone())
	open.year(m.year()).month(m.month()).date(m.date()).dayOfYear(dayOfYear)

	let close = moment.tz(toTime, TIME_FORMAT, true, timezone())
	close.year(m.year()).month(m.month()).date(m.date()).dayOfYear(dayOfYear)

	if (close.isBefore(open)) {
		close.add(1, 'day')
	}

	return {open, close}
}
