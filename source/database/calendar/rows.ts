import type {EventType} from '@frogpond/event-type'
import {addDays, isAfter} from 'date-fns'

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
function allDayDates(wireEvent: WireEvent): {startDate: string; endDate: string} {
	let startDate = utcDate(wireEvent.startTime)
	let endDate = utcDate(wireEvent.endTime)

	if (!isAfter(new Date(endDate), new Date(startDate))) {
		endDate = utcDate(addDays(new Date(startDate), 1).toISOString())
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

export function toRows(sourceId: string, sourceRank: number, wire: WireEvent[]): SourceRows {
	let converted: EventType[] = convertEvents(wire, {})

	let events: EventRow[] = []
	let occurrences: OccurrenceRow[] = []
	let tags: TagRow[] = []

	wire.forEach((wireEvent, index) => {
		let event = converted[index]
		let key = eventKey(event)

		events.push({
			sourceId,
			eventKey: key,
			sourceRank,
			dedupeKey: dedupeKey(event),
			title: wireEvent.title,
			location: wireEvent.location,
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
