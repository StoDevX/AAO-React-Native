import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {parseHours} from './parse-hours'

export function isScheduleReallyOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): boolean {
	let {open, close} = parseHours(schedule, m)
	return m.isBetween(open, close, 'minute', '[)')
}
