// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {timezone} from '@frogpond/constants'

import {TIME_FORMAT} from './constants'

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

	let open = moment.tz(fromTime, TIME_FORMAT, true, timezone())
	open.dayOfYear(dayOfYear)

	let close = moment.tz(toTime, TIME_FORMAT, true, timezone())
	close.dayOfYear(dayOfYear)

	if (close.isBefore(open)) {
		close.add(1, 'day')
	}

	return {open, close}
}
