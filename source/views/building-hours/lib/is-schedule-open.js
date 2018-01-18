// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {parseHours} from './parse-hours'
import {isChapelTime} from './chapel'

export function isScheduleReallyOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: moment,
): boolean {
	let {open, close} = parseHours(schedule, m)
	return m.isBetween(open, close, 'minute', '[)')
}

export function isScheduleOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: moment,
): boolean {
	if (isChapelTime(m)) {
		return false
	}
	return isScheduleReallyOpenAtMoment(schedule, m)
}
