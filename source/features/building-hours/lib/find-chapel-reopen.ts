import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'

import {findChapelWindow} from './chapel'
import {findOpenWindow} from './find-open-window'

/**
 * When `set` resumes the instant chapel ends, the moment it does; null
 * otherwise.
 *
 * Chapel shuts a building whenever the set opts in and chapel is in session,
 * but that is only worth *calling* a chapel closure when chapel is the sole
 * thing holding the doors shut -- when a window is running and outlasts chapel,
 * so the building opens again the minute chapel lets out. A window that dies
 * mid-chapel, or one that closes exactly as chapel ends, leaves the reader
 * waiting for a reopening that never comes; those are ordinary closures whose
 * own hours tell the true story.
 */
export function findChapelReopen(set: NamedBuildingScheduleType, m: Moment): Moment | null {
	if (!set.closedForChapelTime) {
		return null
	}

	let chapel = findChapelWindow(m)
	if (!chapel) {
		return null
	}

	let resumes = set.hours.some((schedule) => {
		let window = findOpenWindow(schedule, m)
		return window !== null && window.close.isAfter(chapel.close)
	})

	return resumes ? chapel.close : null
}
