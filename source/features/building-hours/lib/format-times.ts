import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {formatTime} from '@frogpond/time-format'

import {parseHours} from './parse-hours'

function formatSingleTime(time: Moment, locale?: string): string {
	if (time.hour() === 0 && time.minute() === 0) {
		return 'Midnight'
	}
	if (time.hour() === 12 && time.minute() === 0) {
		return 'Noon'
	}
	return formatTime(time, locale)
}

export function formatBuildingTimes(
	schedule: SingleBuildingScheduleType,
	m: Moment,
	locale?: string,
): string {
	let {open, close} = parseHours(schedule, m)
	return `${formatSingleTime(open, locale)} — ${formatSingleTime(close, locale)}`
}
