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
 * inside a day two calendars share.
 *
 * Start-time order is the only rule, and it does not put today anywhere in
 * particular: the read window keeps 30 days of finished events, so the list
 * leads with the retained past, and `Ongoing` sits wherever its earliest
 * member falls among those days. Where the list *opens* is
 * `todaySectionKey`'s question, not this one's.
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

/**
 * The section the list should open on, and the one the Today button returns to.
 *
 * Not the first section. The read window reaches `RETENTION_DAYS` back, so the
 * sections above are ordered by start time from a month ago -- a list opened at
 * the top opens in the past, and a Today button that scrolls to the top takes
 * the reader further from today rather than to it.
 *
 * Today's own section when there is one. Otherwise the first section at or
 * after today, which is `Ongoing` if anything is running and the next day with
 * something on it if not -- a day with nothing on it is ordinary, and the
 * reader wants the next thing rather than the oldest retained one. When every
 * section is in the past, the last one is the closest to today there is.
 *
 * `Ongoing` is named rather than left to the `>=` below: it happens to sort
 * after any `YYYY-MM-DD`, but a scroll target chosen by an accident of ASCII
 * is one rename away from being wrong.
 */
export function todaySectionKey(sections: readonly EventSection[], now: Moment): string | null {
	let today = sections.find((section) => section.isToday)
	if (today) return today.key

	let todayIso = now.format('YYYY-MM-DD')
	let next = sections.find((section) => section.key === 'Ongoing' || section.key >= todayIso)
	if (next) return next.key

	return sections[sections.length - 1]?.key ?? null
}
