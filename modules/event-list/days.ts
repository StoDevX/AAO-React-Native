import type {Moment} from 'moment-timezone'

import type {SourcedEvent} from './types'

export const DAYS_PER_WEEK = 7

/**
 * Generates a continuous range of whole weeks, from Sunday of the current week
 * through the Saturday of the last event's week. Whole weeks keep every day
 * sitting under a Sunday the strip can snap to.
 *
 * Always yields at least the current week. Day mode has nothing but the strip
 * to navigate with, so a range that could come back empty would leave that
 * screen with no way off the day it opened on.
 */
export function deriveDays(events: readonly SourcedEvent[], now: Moment): Moment[] {
	let today = now.clone().startOf('day')
	let lastDay: Moment | null = null

	for (let entry of events) {
		if (entry.event.isOngoing) {
			continue
		}

		let day = entry.event.startTime.clone().startOf('day')

		if (day.isBefore(today, 'day')) {
			continue
		}

		if (!lastDay || day.isAfter(lastDay, 'day')) {
			lastDay = day
		}
	}

	let sunday = today.clone().startOf('week')

	// Compared as a calendar date rather than as an instant. `now` and an
	// event's `startTime` are both device-local, but nothing in this
	// function's signature says so, and comparing two moments in different
	// zones as instants runs the range a day long or a day short. Whole weeks
	// is the contract the strip's snapping is built on.
	let lastDate = (lastDay ?? today).format('YYYY-MM-DD')

	let days: Moment[] = []
	let current = sunday.clone()
	let weekEnd = ''

	do {
		for (let i = 0; i < DAYS_PER_WEEK; i++) {
			days.push(current.clone())
			weekEnd = current.format('YYYY-MM-DD')
			current.add(1, 'day')
		}
	} while (weekEnd < lastDate)

	return days
}

/**
 * Whether an event belongs on a given day. An ongoing event belongs to every
 * day it spans; anything else belongs to the day it starts on.
 *
 * One predicate rather than two, because a dot on the strip and the rows
 * beneath it have to agree: a dot on a day that turns out to be empty is worse
 * than no dot at all.
 */
export function occursOn(entry: SourcedEvent, day: Moment): boolean {
	if (entry.event.isOngoing) {
		let start = day.clone().startOf('day')
		let end = day.clone().endOf('day')
		return !entry.event.startTime.isAfter(end) && !entry.event.endTime.isBefore(start)
	}

	return entry.event.startTime.isSame(day, 'day')
}

/**
 * One day's events, earliest first. `useMergedEvents` hands over one
 * calendar's events at a time, so without the sort a second calendar's
 * morning sits behind the first calendar's evening.
 */
export function eventsOnDay(events: readonly SourcedEvent[], day: Moment): SourcedEvent[] {
	return events
		.filter((entry) => occursOn(entry, day))
		.sort((one, two) => one.event.startTime.valueOf() - two.event.startTime.valueOf())
}

/**
 * Every day in `days`, mapped to the events that fall on it, earliest first.
 *
 * Built once and read many times: the strip asks which days carry anything and
 * each day on screen asks for its own rows, and walking the whole event list
 * for each of those would be a scan per day. It also means the dots and the
 * rows cannot disagree -- a dot is a bucket that is not empty, and the rows
 * are that same bucket.
 *
 * An event that is ongoing belongs to every day it spans, so it is the one
 * case that still has to be checked against each day. Everything else lands in
 * one bucket by its start date.
 */
export function eventsByDay(
	events: readonly SourcedEvent[],
	days: readonly Moment[],
): Map<string, SourcedEvent[]> {
	let buckets = new Map<string, SourcedEvent[]>()

	// Each day's key and its two bounds, worked out once. Formatting a moment
	// and cloning one both cost, and an ongoing event has to be checked against
	// every day in the range -- doing it inside that loop would rebuild the same
	// handful of values for every event.
	let calendar = days.map((day) => {
		let iso = day.format('YYYY-MM-DD')
		let bucket: SourcedEvent[] = []
		buckets.set(iso, bucket)
		return {bucket, start: day.clone().startOf('day'), end: day.clone().endOf('day')}
	})

	for (let entry of events) {
		if (entry.event.isOngoing) {
			for (let {bucket, start, end} of calendar) {
				if (!entry.event.startTime.isAfter(end) && !entry.event.endTime.isBefore(start)) {
					bucket.push(entry)
				}
			}
			continue
		}

		buckets.get(entry.event.startTime.format('YYYY-MM-DD'))?.push(entry)
	}

	// `useMergedEvents` hands over one calendar's events at a time, so without
	// this a second calendar's morning sits behind the first's evening.
	for (let bucket of buckets.values()) {
		bucket.sort((one, two) => one.event.startTime.valueOf() - two.event.startTime.valueOf())
	}

	return buckets
}

/**
 * The ISO dates, among `days`, that carry at least one event. What the strip
 * draws its dots from.
 */
export function daysWithEvents(
	events: readonly SourcedEvent[],
	days: readonly Moment[],
): Set<string> {
	let marked = new Set<string>()

	for (let [iso, bucket] of eventsByDay(events, days)) {
		if (bucket.length > 0) {
			marked.add(iso)
		}
	}

	return marked
}
