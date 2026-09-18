import type {Moment} from 'moment-timezone'
import type {BuildingStatusType, SingleBuildingScheduleType} from '../types'

import {parseHours} from './parse-hours'

const ALMOST_THRESHOLD_MINUTES = 30

function within(minutes: number, start: Moment, end: Moment): boolean {
	return start.clone().add(minutes, 'minutes').isSameOrAfter(end)
}

/**
 * How one window reads at `m`: running, about to change, or neither.
 *
 * The caller picks the wording. This says only which state the window is in,
 * so the set of answers stays closed and a glyph can be chosen from it.
 */
export function getScheduleStatusAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Moment,
): BuildingStatusType {
	let {open, close} = parseHours(schedule, m)

	if (m.isBefore(open)) {
		return within(ALMOST_THRESHOLD_MINUTES, m, open) ? 'Almost Open' : 'Closed'
	}

	if (m.isBetween(open, close, 'minute', '[)')) {
		return within(ALMOST_THRESHOLD_MINUTES, m, close) ? 'Almost Closed' : 'Open'
	}

	return 'Closed'
}
