import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {findOpenWindow} from './find-open-window'
import {getDayOfWeek} from './get-day-of-week'

/**
 * The schedules worth considering at `m`: those that open on `m`'s own day,
 * plus any whose window opened last night and is still running. Without the
 * second group a 9:00pm–2:00am Friday window vanishes the moment Saturday
 * begins; without the first, a building that has not opened yet today would
 * not be listed at all.
 */
export function schedulesInEffect(
	hours: SingleBuildingScheduleType[],
	m: Moment,
): SingleBuildingScheduleType[] {
	let dayOfWeek = getDayOfWeek(m)
	return hours.filter(
		(schedule) => schedule.days.includes(dayOfWeek) || findOpenWindow(schedule, m) !== null,
	)
}
