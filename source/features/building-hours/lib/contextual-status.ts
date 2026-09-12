import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {getDayOfWeek} from './get-day-of-week'
import {findOpenWindow, windowOpeningOn} from './find-open-window'
import {isChapelTime} from './chapel'
import {findChapelReopen} from './find-chapel-reopen'

const ALMOST_THRESHOLD_MINUTES = 30

// Chapel windows run 20 to 95 minutes, so the 30-minute threshold above would
// spend most of one counting down. Ten minutes keeps the countdown meaningful.
const CHAPEL_COUNTDOWN_MINUTES = 10

/** Formats a time as "8 PM", or "8:15 PM" when it isn't on the hour. */
function formatTime(m: Moment): string {
	return m.format(m.minute() === 0 ? 'h A' : 'h:mm A')
}

type OpenWindow = {open: Moment; close: Moment}

function findCurrentOpen(building: BuildingType, now: Moment): OpenWindow | null {
	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen === false) continue
		if (set.closedForChapelTime && isChapelTime(now)) continue

		for (let hours of set.hours) {
			// `findOpenWindow` decides this on its own, and counts a window
			// that opened last night -- filtering by today's day first would
			// discard exactly those.
			let window = findOpenWindow(hours, now)
			if (window) {
				return window
			}
		}
	}
	return null
}

function findChapelReopenForBuilding(building: BuildingType, now: Moment): Moment | null {
	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen === false) continue

		let reopen = findChapelReopen(set, now)
		if (reopen) {
			return reopen
		}
	}
	return null
}

/**
 * The soonest window today that has not opened yet at `now`, or null when
 * nothing opens again today.
 *
 * Every window is weighed rather than returning at the first future one, because
 * sets are grouped by what they describe and not by time -- a set written later
 * can hold the earlier window, and its rows need not run in order either.
 */
function findNextOpenToday(building: BuildingType, now: Moment): OpenWindow | null {
	let dayOfWeek = getDayOfWeek(now)
	let earliest: OpenWindow | null = null

	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen === false) continue

		for (let hours of set.hours) {
			if (!hours.days.includes(dayOfWeek)) continue

			let window = windowOpeningOn(hours, now)
			if (now.isBefore(window.open) && (!earliest || window.open.isBefore(earliest.open))) {
				earliest = window
			}
		}
	}

	return earliest
}

/**
 * Human-readable status for a building right now, e.g. "Open until 8 PM",
 * "Closes in 15 min", "Reopens at 10:30 AM", "Reopens in 8 min",
 * "Opens at 5 PM", "Opens in 10 min", or "Closed".
 */
export function contextualStatus(building: BuildingType, now: Moment): string {
	let current = findCurrentOpen(building, now)
	if (current) {
		let minutesLeft = current.close.diff(now, 'minutes')
		if (minutesLeft <= ALMOST_THRESHOLD_MINUTES) {
			return `Closes in ${minutesLeft} min`
		}
		return `Open until ${formatTime(current.close)}`
	}

	let chapelReopen = findChapelReopenForBuilding(building, now)
	if (chapelReopen) {
		let minutesLeft = chapelReopen.diff(now, 'minutes')
		if (minutesLeft <= CHAPEL_COUNTDOWN_MINUTES) {
			return `Reopens in ${minutesLeft} min`
		}
		return `Reopens at ${formatTime(chapelReopen)}`
	}

	let next = findNextOpenToday(building, now)
	if (next) {
		let minutesUntilOpen = next.open.diff(now, 'minutes')
		if (minutesUntilOpen <= ALMOST_THRESHOLD_MINUTES) {
			return `Opens in ${minutesUntilOpen} min`
		}
		return `Opens at ${formatTime(next.open)}`
	}

	// Not "Closed today": this is only reached once nothing opens again today, so
	// both readings are true, but "Closed today" also reads as "has no hours
	// today" -- a claim about the whole day that a building open this morning
	// would contradict. The detail sheet carries the real hours.
	return 'Closed'
}
