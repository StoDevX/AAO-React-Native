import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType, SingleBuildingScheduleType} from '../types'

import {findOpenWindow, windowOpeningOn} from './find-open-window'
import {getDayOfWeek} from './get-day-of-week'

/**
 * The window whose hours sit beside a venue's status, across all its blocks:
 * the one running now; else the next to open today, which is what "Opens at"
 * refers to; else today's last, once everything has closed. Null when no
 * window opens today.
 *
 * An empty `days` means every day, as `findOpenWindow` reads it.
 */
export function statusWindow(
	blocks: Array<NamedBuildingScheduleType>,
	now: Moment,
): SingleBuildingScheduleType | null {
	let sets = blocks.flatMap((block) => block.hours)

	let running = sets.find((set) => findOpenWindow(set, now))
	if (running) {
		return running
	}

	let day = getDayOfWeek(now)
	let today = sets
		.filter((set) => set.days.length === 0 || set.days.includes(day))
		.map((set) => ({set, opens: windowOpeningOn(set, now).open}))
		.sort((a, b) => a.opens.valueOf() - b.opens.valueOf())

	let next = today.find(({opens}) => opens.isAfter(now))
	return (next ?? today.at(-1))?.set ?? null
}
