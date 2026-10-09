import type {AddToCalendarResult} from '@frogpond/add-to-device-calendar'
import type {EventType} from '@frogpond/event-type'

import type {CalendarSourceId, PublicEventTitle, TelemetryEvent} from './catalog'

const KNOWN_SOURCES: ReadonlySet<string> = new Set([
	'stolaf',
	'presence',
	'carleton',
	'ksto-schedule',
	'krlx-schedule',
	'sumo-schedule',
	'upcoming-convos',
])

/** The event screen's `source` route param, narrowed to the calendar feeds; `other` for anything else. */
export function calendarSourceId(source: string): CalendarSourceId {
	return KNOWN_SOURCES.has(source) ? (source as CalendarSourceId) : 'other'
}

/**
 * The events to send when Add to Calendar ends. A save also names the event,
 * but only on an anonymous log: a title beside a device ID would build a list
 * of what one person plans to attend.
 */
export function addToCalendarEvents(
	result: AddToCalendarResult,
	source: string,
	event: EventType,
): TelemetryEvent[] {
	let sourceId = calendarSourceId(source)
	let events: TelemetryEvent[] = [
		{name: 'calendar.add_to_device', attributes: {result, source: sourceId}},
	]
	if (result === 'saved') {
		events.push({
			name: 'calendar.event.added',
			anonymous: true,
			attributes: {source: sourceId, title: event.title as PublicEventTitle},
		})
	}
	return events
}
