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

interface CalendarParser {
	format: 'json' | 'text'
	parse: (body: unknown) => WireEvent[]
}

// One entry per media type, so its wire format and its parser can't drift
// apart the way a separate switch and ternary could.
const CALENDAR_PARSERS: Record<string, CalendarParser> = {
	[TEC_EVENTS]: {format: 'json', parse: parseTecEvents},
	[FROGPOND_EVENTS]: {format: 'json', parse: parseEvents},
	[ICAL_EVENTS]: {format: 'text', parse: parseIcalEvents},
}

export const CALENDAR_TYPES = Object.keys(CALENDAR_PARSERS)

function parserFor(type: string): CalendarParser {
	let parser = CALENDAR_PARSERS[type]
	if (!parser) throw new Error(`no calendar parser for "${type}"`)
	return parser
}

async function fetchCalendar(calendar: NamedCalendar, signal: AbortSignal): Promise<WireEvent[]> {
	let manifest = await fetchManifest(queryClient)
	let resolved = resolveSource(manifest, REL_CALENDAR, calendar, CALENDAR_TYPES)

	let parser = parserFor(resolved.type)
	let body = await fetchSourceBody(resolved.href, signal, 'Calendar', parser.format)
	return parser.parse(body)
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
