import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {isChapelTime} from './chapel'
import {isScheduleReallyOpenAtMoment} from './is-schedule-really-open'

/**
 * Whether `schedule` is open at `m`, closing early for chapel only when
 * `closedForChapelTime` says this schedule observes it -- the same
 * per-schedule flag `getShortBuildingStatus`, `isBuildingOpen`,
 * `contextualStatus`, and `getDetailedBuildingStatus` all check first.
 * Chapel is a St. Olaf-only closure, and only St. Olaf schedules ever set
 * the flag, so leaving it unset (Carleton's data never sets it) leaves a
 * schedule open straight through St. Olaf's chapel window.
 */
export function isScheduleOpenAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Moment,
	closedForChapelTime = false,
): boolean {
	if (closedForChapelTime && isChapelTime(m)) {
		return false
	}
	return isScheduleReallyOpenAtMoment(schedule, m)
}
