import type {Temporal} from 'temporal-polyfill'
import type {SingleBuildingScheduleType} from '../types'

import {isChapelTime} from './chapel'
import {isScheduleReallyOpenAtMoment} from './is-schedule-really-open'

export function isScheduleOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Temporal.ZonedDateTime,
): boolean {
	if (isChapelTime(m)) {
		return false
	}
	return isScheduleReallyOpenAtMoment(schedule, m)
}
