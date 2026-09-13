import type {EventType} from '@frogpond/event-type'

import {convertEvents} from '../../../modules/ccc-calendar/convert.ts'
import type {WireEvent} from '../../../modules/ccc-calendar/parsers/events.ts'
import {dedupeKey, eventKey} from '../../../modules/event-list/keys.ts'

export type EventRow = {
	sourceId: string
	eventKey: string
	sourceRank: number
	dedupeKey: string
	title: string
	location: string | null
	wire: string
}
export type OccurrenceRow = {
	sourceId: string
	eventKey: string
	allDay: boolean
	startUtc: number
	endUtc: number
	startDate: string | null
	endDate: string | null
}
export type TagRow = {
	sourceId: string
	eventKey: string
	axis: 'category' | 'organization'
	value: string
}
export type SourceRows = {events: EventRow[]; occurrences: OccurrenceRow[]; tags: TagRow[]}

/// An all-day event names a calendar date, not an instant. Both web sources
/// guarantee the wire instant's UTC date IS that calendar date -- iCal emits
/// UTC midnight, TEC emits campus midnight expressed in UTC -- so the date is
/// read straight out of the UTC representation. Reading a local date here
/// would land a day early anywhere west of UTC.
function utcDate(instant: string): string {
	return instant.slice(0, 10)
}

/// A `YYYY-MM-DD` string parses as UTC midnight (per spec), so this advances
/// the calendar date entirely in UTC via `setUTCDate` -- never `setDate`,
/// which steps the *local* day and, across a spring-forward DST transition,
/// covers only 23 real hours and can fail to reach the next UTC date at all.
function utcDatePlusOneDay(date: string): string {
	let instant = new Date(`${date}T00:00:00Z`)
	instant.setUTCDate(instant.getUTCDate() + 1)
	return utcDate(instant.toISOString())
}

/// `end_date` is stored exclusive, and the wire end instant's UTC date
/// already IS that exclusive end -- for two different reasons that happen to
/// agree. TEC emits campus midnight expressed in UTC, so `23:59:59` on the
/// last local day lands in the *next* UTC day; iCal emits DATE values at UTC
/// midnight, and RFC 5545 already defines a DATE-valued `DTEND` as
/// exclusive. Adding a day here would make every all-day event one day too
/// long. The only adjustment is the zero-length guard: a degenerate span
/// (wire start and end sharing a UTC date) would otherwise read as already
/// over, so it picks up a whole day -- the same relocation `convertEvents`
/// makes in instant space for `EventType.endTime`.
///
/// The comparison below is zone-safe: `new Date('2026-03-08')` parses as UTC
/// midnight (per spec), so comparing two such values never consults the
/// local zone. Advancing the date, if needed, has to stay equally UTC-only --
/// see `utcDatePlusOneDay`.
function allDayDates(wireEvent: WireEvent): {startDate: string; endDate: string} {
	let startDate = utcDate(wireEvent.startTime)
	let endDate = utcDate(wireEvent.endTime)

	if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
		endDate = utcDatePlusOneDay(startDate)
	}

	return {startDate, endDate}
}

function tagRows(
	sourceId: string,
	key: string,
	axis: 'category' | 'organization',
	values: readonly string[] | undefined,
): TagRow[] {
	if (!values) {
		return []
	}
	return [...new Set(values)].map((value) => ({sourceId, eventKey: key, axis, value}))
}

/**
 * One source's parsed feed, as the rows a write inserts.
 *
 * **Deduplicated by `eventKey` within the feed, first copy winning.**
 * `eventKey` is `startTime|title` and collides for two events that genuinely
 * share both -- two same-titled all-day events on one date being the easiest
 * case, since an all-day event's `startTime` is local midnight. The second
 * row violates `event`'s primary key, which rolls the whole write back and
 * reports the source failed -- and since the collision is in the upstream
 * feed, every later refresh fails the same way and that calendar freezes at
 * its last good window. Dropping the repeat avoids that: first wins, the
 * rest are not there.
 */
export function toRows(sourceId: string, sourceRank: number, wire: WireEvent[]): SourceRows {
	let converted: EventType[] = convertEvents(wire, {})

	let events: EventRow[] = []
	let occurrences: OccurrenceRow[] = []
	let tags: TagRow[] = []
	let seen = new Set<string>()

	wire.forEach((wireEvent, index) => {
		let event = converted[index]
		let key = eventKey(event)

		if (seen.has(key)) return
		seen.add(key)

		events.push({
			sourceId,
			eventKey: key,
			sourceRank,
			dedupeKey: dedupeKey(event),
			title: wireEvent.title,
			// `WireEvent.location` defaults to `''` rather than being absent, but
			// the column is nullable -- normalizing here keeps "no location" one
			// value instead of two spellings a later query would have to handle.
			location: wireEvent.location === '' ? null : wireEvent.location,
			wire: JSON.stringify(wireEvent),
		})

		let startUtc = Date.parse(wireEvent.startTime)
		let endUtc = Date.parse(wireEvent.endTime)

		if (wireEvent.isAllDay) {
			let {startDate, endDate} = allDayDates(wireEvent)
			occurrences.push({
				sourceId,
				eventKey: key,
				allDay: true,
				startUtc,
				endUtc,
				startDate,
				endDate,
			})
		} else {
			occurrences.push({
				sourceId,
				eventKey: key,
				allDay: false,
				startUtc,
				endUtc,
				startDate: null,
				endDate: null,
			})
		}

		tags.push(...tagRows(sourceId, key, 'category', wireEvent.categories))
		tags.push(...tagRows(sourceId, key, 'organization', wireEvent.organization))
	})

	return {events, occurrences, tags}
}
