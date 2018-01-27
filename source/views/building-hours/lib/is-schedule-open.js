// @flow
import moment from 'moment-timezone'
import type {BuildingScheduleEntry} from '../types'

import {parseHours} from './parse-hours'
import {isChapelTime} from './chapel'

export function isScheduleReallyOpenAtMoment(
	schedule: BuildingScheduleEntry,
	m: moment,
): boolean {
	let {open, close} = parseHours(schedule, m)
	return m.isBetween(open, close, 'minute', '[)')
}

export function isScheduleOpenAtMoment(
	schedule: BuildingScheduleEntry,
	m: moment,
): boolean {
	if (isChapelTime(m)) {
		return false
	}
	return isScheduleReallyOpenAtMoment(schedule, m)
}
