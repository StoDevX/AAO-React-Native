import {fetchManifest, fetchSourceBody, REL_CALENDAR, resolveSource} from '@frogpond/data-sources'
import {eventKey} from '@frogpond/event-list'
import {EventType} from '@frogpond/event-type'
import {queryOptions} from '@tanstack/react-query'
import moment from 'moment'
import {queryClient} from '../../source/init/tanstack-query'
import {parseEvents} from './parsers/events'
import {parseIcalEvents} from './parsers/ical'
import {parseTecEvents, type WireEvent} from './parsers/tec-events'
import {NamedCalendar} from './types'

export const keys = {
	named: (name: string) => ['calendar', 'named', name] as const,
}

type EventMapper = (event: EventType) => EventType

function convertEvents(data: WireEvent[], options: {eventMapper?: EventMapper}): EventType[] {
	let events: EventType[] = data.map((event) => ({
		...event,
		startTime: moment(event.startTime),
		endTime: moment(event.endTime),
	}))

	if (options.eventMapper) {
		events = events.map(options.eventMapper)
	}

	return events
}

const TEC_EVENTS = 'application/vnd.tribe.events.v1+json'
const FROGPOND_EVENTS = 'application/vnd.frogpond.events+json'
const ICAL_EVENTS = 'text/calendar'

export const CALENDAR_TYPES = [TEC_EVENTS, FROGPOND_EVENTS, ICAL_EVENTS] as const

function parse(type: string, body: unknown): WireEvent[] {
	switch (type) {
		case TEC_EVENTS:
			return parseTecEvents(body)
		case FROGPOND_EVENTS:
			return parseEvents(body)
		case ICAL_EVENTS:
			return parseIcalEvents(body)
		default:
			throw new Error(`no calendar parser for "${type}"`)
	}
}

async function fetchCalendar(calendar: NamedCalendar, signal: AbortSignal): Promise<WireEvent[]> {
	let manifest = await fetchManifest(queryClient)
	let resolved = resolveSource(manifest, REL_CALENDAR, calendar, CALENDAR_TYPES)

	let format: 'json' | 'text' = resolved.type === ICAL_EVENTS ? 'text' : 'json'
	let body = await fetchSourceBody(resolved.href, signal, 'Calendar', format)
	return parse(resolved.type, body)
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedCalendarOptions = (
	calendar: NamedCalendar,
	options: {eventMapper?: EventMapper} = {},
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		select: (events) => convertEvents(events, options),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const namedCalendarEventOptions = (
	calendar: NamedCalendar,
	key: string,
	options: {eventMapper?: EventMapper} = {},
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		select: (events) => convertEvents(events, options).find((event) => eventKey(event) === key),
	})
