import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {getDayOfWeek} from './get-day-of-week'
import {parseHours} from './parse-hours'
import {isChapelTime} from './chapel'

const ALMOST_THRESHOLD_MINUTES = 30

/** Formats a time as "8 PM", or "8:15 PM" when it isn't on the hour. */
function formatTime(m: Moment): string {
	return m.format(m.minute() === 0 ? 'h A' : 'h:mm A')
}

type OpenWindow = {open: Moment; close: Moment}

function findCurrentOpen(building: BuildingType, now: Moment): OpenWindow | null {
	let dayOfWeek = getDayOfWeek(now)

	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen === false) continue
		if (set.closedForChapelTime && isChapelTime(now)) continue

		for (let hours of set.hours) {
			if (!hours.days.includes(dayOfWeek)) continue

			let {open, close} = parseHours(hours, now)
			if (now.isBetween(open, close, 'minute', '[)')) {
				return {open, close}
			}
		}
	}
	return null
}

function findNextOpenToday(building: BuildingType, now: Moment): OpenWindow | null {
	let dayOfWeek = getDayOfWeek(now)

	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen === false) continue

		for (let hours of set.hours) {
			if (!hours.days.includes(dayOfWeek)) continue

			let {open, close} = parseHours(hours, now)
			if (now.isBefore(open)) {
				return {open, close}
			}
		}
	}
	return null
}

/**
 * Human-readable status for a building right now, e.g. "Open until 8 PM",
 * "Closes in 15 min", "Opens at 5 PM", "Opens in 10 min", or "Closed today".
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

	let next = findNextOpenToday(building, now)
	if (next) {
		let minutesUntilOpen = next.open.diff(now, 'minutes')
		if (minutesUntilOpen <= ALMOST_THRESHOLD_MINUTES) {
			return `Opens in ${minutesUntilOpen} min`
		}
		return `Opens at ${formatTime(next.open)}`
	}

	return 'Closed today'
}
