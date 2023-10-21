import type {SingleBuildingScheduleType} from '../types'
import {RESULT_FORMAT} from './constants'
import {parseHours} from './parse-hours'
import type {Moment} from 'moment-timezone'

function formatSingleTime(time: Moment): string {
	if (time.hour() === 0 && time.minute() === 0) {
		return 'Midnight'
	}
	if (time.hour() === 12 && time.minute() === 0) {
		return 'Noon'
	}
	return time.format(RESULT_FORMAT)
}

export function formatBuildingTimes(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): string {
	let {open, close} = parseHours(schedule, m)
	return `${formatSingleTime(open)} — ${formatSingleTime(close)}`
}
