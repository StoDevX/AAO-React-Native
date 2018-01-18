// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {TIME_FORMAT, CENTRAL_TZ} from './constants'

type HourPairType = {open: moment, close: moment}

export function parseHours(
	{from: fromTime, to: toTime}: SingleBuildingScheduleType,
	m: moment,
): HourPairType {
	let dayOfYear = m.dayOfYear()

	// if the moment is before 3am
	if (m.hour() < 2) {
		dayOfYear -= 1
	}

	let open = moment.tz(fromTime, TIME_FORMAT, true, CENTRAL_TZ)
	open.dayOfYear(dayOfYear)

	let close = moment.tz(toTime, TIME_FORMAT, true, CENTRAL_TZ)
	close.dayOfYear(dayOfYear)

	if (close.isBefore(open)) {
		close.add(1, 'day')
	}

	return {open, close}
}
