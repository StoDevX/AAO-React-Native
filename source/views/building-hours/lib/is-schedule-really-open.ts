import type {Temporal} from 'temporal-polyfill'
import type {SingleBuildingScheduleType} from '../types'
import {isBetween} from '../../../lib/temporal'

import {parseHours} from './parse-hours'

export function isScheduleReallyOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Temporal.ZonedDateTime,
): boolean {
	let {open, close} = parseHours(schedule, m)
	return isBetween(m, open, close, 'minute', '[)')
}
