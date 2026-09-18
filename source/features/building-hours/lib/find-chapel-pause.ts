import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'

import {CHAPEL_COUNTDOWN_MINUTES, findNextChapelWindow} from './chapel'
import {findOpenWindow} from './find-open-window'

/**
 * When chapel is about to shut `set`, the moment chapel starts; null otherwise.
 *
 * The mirror of `findChapelReopen`, which speaks once chapel already has the
 * doors shut. A set earns the warning only while it is open, opting into chapel
 * closure, and running a window chapel will interrupt: a window closing before
 * chapel starts is closing on its own terms, and blaming chapel for an ordinary
 * closing time would misread the schedule.
 */
export function findChapelPause(set: NamedBuildingScheduleType, m: Moment): Moment | null {
	if (!set.closedForChapelTime) {
		return null
	}

	let chapel = findNextChapelWindow(m)
	if (!chapel) {
		return null
	}

	if (chapel.open.diff(m, 'minutes') > CHAPEL_COUNTDOWN_MINUTES) {
		return null
	}

	let interrupted = set.hours.some((schedule) => {
		let window = findOpenWindow(schedule, m)
		return window !== null && window.close.isAfter(chapel.open)
	})

	return interrupted ? chapel.open : null
}
