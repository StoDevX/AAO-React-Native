import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {Moment} from 'moment-timezone'

import {formatSectionHeader} from './times'
import type {SourcedEvent} from './types'

export interface EventSection {
	readonly key: string
	readonly title: string
	readonly isToday: boolean
	readonly data: SourcedEvent[]
}

/**
 * Groups events into an `Ongoing` group and one group per day, with today's
 * events together regardless of the timezone quirks in `event.startTime`.
 *
 * Day groups are keyed on an unambiguous ISO date rather than on their
 * display title, which is locale-aware and computed separately.
 *
 * Events are put in start-time order first. `useMergedEvents` hands over one
 * calendar's events at a time, so without this a second calendar's earlier
 * days sit behind a first calendar's later ones -- today included, which
 * leaves the list opening a month out and the day-picker strip parked there
 * with it. `groupBy` keeps each group where its first member put it, so
 * ordering the events is what orders the sections; it also orders the rows
 * inside a day two calendars share. An ongoing event starts before today by
 * definition, so `Ongoing` leads the list without a rule of its own.
 */
export function groupEvents(events: readonly SourcedEvent[], now: Moment): EventSection[] {
	let ordered = Array.from(events).sort(
		(one, two) => one.event.startTime.valueOf() - two.event.startTime.valueOf(),
	)

	let grouped = groupBy(ordered, (entry) => {
		// Only show as ongoing if still active (end time is after now)
		if (entry.event.isOngoing && entry.event.endTime.isAfter(now)) {
			return 'Ongoing'
		}
		if (entry.event.startTime.isSame(now, 'day')) {
			return 'Today'
		}
		return entry.event.startTime.format('YYYY-MM-DD') // google returns events in CST
	})

	return toPairs(grouped).map(([key, data]) => {
		if (key === 'Ongoing') {
			return {key, title: 'Ongoing', isToday: false, data}
		}
		if (key === 'Today') {
			return {key, title: formatSectionHeader(now), isToday: true, data}
		}
		return {key, title: formatSectionHeader(data[0].event.startTime), isToday: false, data}
	})
}
