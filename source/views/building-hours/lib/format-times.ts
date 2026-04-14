import type {Temporal} from 'temporal-polyfill'
import type {SingleBuildingScheduleType} from '../types'
import {format} from '../../../lib/temporal'

import {RESULT_FORMAT} from './constants'
import {parseHours} from './parse-hours'

function formatSingleTime(time: Temporal.ZonedDateTime): string {
	if (time.hour === 0 && time.minute === 0) {
		return 'Midnight'
	}
	if (time.hour === 12 && time.minute === 0) {
		return 'Noon'
	}
	return format(time, RESULT_FORMAT)
}

export function formatBuildingTimes(
	schedule: SingleBuildingScheduleType,
	m: Temporal.ZonedDateTime,
): string {
	let {open, close} = parseHours(schedule, m)
	return `${formatSingleTime(open)} — ${formatSingleTime(close)}`
}
