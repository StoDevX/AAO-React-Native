import {fetchManifest, REL_CALENDAR, resolveSource} from '@frogpond/data-sources'
import {eventKey} from '@frogpond/event-list'
import {EventType} from '@frogpond/event-type'
import {queryOptions} from '@tanstack/react-query'
import moment from 'moment'
import {queryClient} from '../../source/init/tanstack-query'
import {parseEvents} from './parsers/events'
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

export const CALENDAR_TYPES = [TEC_EVENTS, FROGPOND_EVENTS] as const

async function fetchCalendar(calendar: NamedCalendar, signal: AbortSignal): Promise<WireEvent[]> {
	let manifest = await fetchManifest(queryClient)
	let resolved = resolveSource(manifest, REL_CALENDAR, calendar, CALENDAR_TYPES)

	let response = await fetch(resolved.href, {signal})
	if (!response.ok) {
		throw new Error(`Calendar fetch failed: ${response.status}`)
	}

	let body: unknown = await response.json()
	return resolved.type === TEC_EVENTS ? parseTecEvents(body) : parseEvents(body)
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
