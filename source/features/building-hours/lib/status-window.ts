import type {Moment} from 'moment-timezone'
import type {BuildingType, SingleBuildingScheduleType} from '../types'

import {findCurrentOpen, windowsOpeningToday} from './contextual-status'

/**
 * The hours that sit beside a venue's status: the window running now; else the
 * next to open today, which is what "Opens at" counts down to; else today's
 * last, once everything has closed. Null when nothing opens today.
 *
 * Built on the same searches as `contextualStatus`, so the status and the
 * times beside it always describe the same window.
 */
export function statusWindow(
	building: BuildingType,
	clock: Moment,
): SingleBuildingScheduleType | null {
	// Counted from the minute's start, as the status is.
	let now = clock.clone().startOf('minute')

	let current = findCurrentOpen(building, now)
	if (current) {
		return current.hours
	}

	let today = windowsOpeningToday(building, now)
	let next = today.find((window) => now.isBefore(window.open))
	return (next ?? today.at(-1))?.hours ?? null
}
