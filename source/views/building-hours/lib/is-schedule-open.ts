import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {isChapelTime} from './chapel'
import {isScheduleReallyOpenAtMoment} from './is-schedule-really-open'

export function isScheduleOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): boolean {
	if (isChapelTime(m)) {
		return false
	}
	return isScheduleReallyOpenAtMoment(schedule, m)
}
