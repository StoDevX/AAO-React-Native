import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {findOpenWindow, windowOpeningOn} from './find-open-window'
import type {HourPairType} from './find-open-window'

/**
 * The window to show for `schedule` at `m`: the one it is currently running if
 * there is one, so that a late-night window reads as its own hours after
 * midnight rather than as tonight's not-yet-started ones. Falls back to the
 * window opening on `m`'s day when nothing is running, which is what an
 * "opens at" or "closed" reading wants.
 */
export function parseHours(schedule: SingleBuildingScheduleType, m: Moment): HourPairType {
	return findOpenWindow(schedule, m) ?? windowOpeningOn(schedule, m)
}
