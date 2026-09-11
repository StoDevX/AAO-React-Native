import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType, SingleBuildingScheduleType} from '../types'

import {isScheduleOpenAtMoment} from './is-schedule-open'

/**
 * Whether a single schedule row is the one running at `now`, for the accent
 * bar on a building's detail sheet.
 *
 * `isScheduleOpenAtMoment` already decides which day a window belongs to --
 * a Friday 9:00pm-2:00am window is still the Friday row at Saturday 1:00am --
 * so a row must not first be filtered against `now`'s own day of week. Doing
 * that drops exactly the rows that ran through midnight.
 */
export function isScheduleRowActive(
	set: NamedBuildingScheduleType,
	schedule: SingleBuildingScheduleType,
	now: Moment,
): boolean {
	if (set.isPhysicallyOpen === false) {
		return false
	}

	return isScheduleOpenAtMoment(schedule, now, set.closedForChapelTime)
}
