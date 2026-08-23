import type {Moment} from 'moment-timezone'

import type {SourcedEvent} from './types'

/**
 * Extracts unique days from events, starting from today, sorted chronologically.
 * Excludes ongoing events (they appear in their own section, not a date).
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let seen = new Set<string>()
	let days: Moment[] = []

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')
		let key = day.format('YYYY-MM-DD')

		if (day.isBefore(now, 'day')) {
			continue
		}

		if (!seen.has(key)) {
			seen.add(key)
			days.push(day)
		}
	}

	return days.sort((a, b) => a.valueOf() - b.valueOf())
}
