import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {Moment} from 'moment-timezone'
import type {ScrollGeometry} from '@expo/ui/swift-ui'

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
 * Today's own section when there is one, otherwise the first day at or after
 * today -- a day with nothing on it is ordinary, and the reader wants the next
 * thing rather than the oldest retained one. When every day is in the past, the
 * last of them is the closest to today there is.
 *
 * **Never `Ongoing`.** A multi-week run sits above the fold and is reached by
 * scrolling up, like any past day. Excluding it by name is load-bearing and not
 * merely tidy: `groupEvents` positions `Ongoing` by its earliest member, so a
 * run that began in July leads the array, and `'Ongoing' >= '2026-09-15'` is
 * true in string order ('O' is 0x4F, '2' is 0x32). Leaving it to the comparison
 * below would pick it anyway -- the original bug, reintroduced through an ASCII
 * accident. The `Ongoing` section itself stays in the list; only the scroll
 * target skips it.
 */
export function todaySectionKey(sections: readonly EventSection[], now: Moment): string | null {
	let today = sections.find((section) => section.isToday)
	if (today) return today.key

	let days = sections.filter((section) => section.key !== 'Ongoing')

	let todayIso = now.format('YYYY-MM-DD')
	let next = days.find((section) => section.key >= todayIso)
	if (next) return next.key

	return days.at(-1)?.key ?? null
}

/**
 * The sections Upcoming shows: `Ongoing`, today, every day after, and whatever
 * on an earlier day has not ended yet.
 *
 * The read window keeps a month of finished events for the day view's strip
 * and the event detail's timeline. Upcoming is what is ahead, and each
 * finished row in it would be one more row mounted on the main thread for a
 * reader who has to scroll up to see it.
 *
 * An earlier day keeps its unfinished events because `isOngoing` is worked out
 * when the events are read, not when they are shown: a schedule fetched before
 * midnight files a show that is on air now under the day it began.
 */
export function upcomingSections(sections: readonly EventSection[], now: Moment): EventSection[] {
	let todayIso = now.format('YYYY-MM-DD')
	return sections.flatMap((section) => {
		if (section.key === 'Ongoing' || section.key === 'Today' || section.key >= todayIso) {
			return [section]
		}
		let running = section.data.filter((entry) => entry.event.endTime.isAfter(now))
		return running.length > 0 ? [{...section, data: running}] : []
	})
}

/**
 * The leading sections worth mounting for a budget of rows, whole days at a
 * time, and always through `throughKey`.
 *
 * Every mounted row is a set of `@expo/ui` views created on the main thread in
 * one go -- `LazyVStack` only defers SwiftUI's drawing, not React's mounting --
 * so mounting a whole list freezes the screen for seconds. Mounting a screen or
 * two and growing as the reader nears the end keeps each step small.
 *
 * `throughKey` is the section the list opens on: a scroll target that is not
 * mounted is one SwiftUI cannot reach, and a long `Ongoing` above today could
 * otherwise spend the whole budget.
 */
export function sectionsToMount(
	sections: readonly EventSection[],
	rowBudget: number,
	throughKey: string | null,
): EventSection[] {
	let through = throughKey ? sections.findIndex((section) => section.key === throughKey) : -1

	let rows = 0
	let count = 0
	while (count < sections.length && (rows < rowBudget || count <= through)) {
		rows += sections[count].data.length
		count += 1
	}

	return sections.slice(0, count)
}

/**
 * Whether less than a screen of content is left below what the reader can
 * see -- the point at which the list mounts its next step.
 */
export function isNearEnd(geometry: ScrollGeometry): boolean {
	let remaining = geometry.contentHeight - (geometry.contentOffsetY + geometry.containerHeight)
	return remaining < geometry.containerHeight
}
