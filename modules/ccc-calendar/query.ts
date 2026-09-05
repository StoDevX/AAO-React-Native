import {fetchManifest, fetchSourceBody, REL_CALENDAR, resolveSource} from '@frogpond/data-sources'
import {eventKey} from '@frogpond/event-list/calendar-util'
import {EventType} from '@frogpond/event-type'
import {queryOptions} from '@tanstack/react-query'
import * as Calendar from 'expo-calendar'
import moment from 'moment'
import {queryClient} from '../../source/init/tanstack-query'
import {getFullCalendarAccess, listDeviceEvents} from './device-calendar'
import uitestFixtures from './fixtures/uitest-events.json'
import {parseEvents, type WireEvent} from './parsers/events'
import {parseIcalEvents} from './parsers/ical'
import {parseTecEvents} from './parsers/tec-events'
import {deviceSourceId, toDeviceSource, type SourcedEvent} from './sources'
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
	// UI test fixture calendar returns bundled data instead of network fetch
	if (calendar === 'uitest') {
		return uitestFixtures as WireEvent[]
	}

	let manifest = await fetchManifest(queryClient)
	let resolved = resolveSource(manifest, REL_CALENDAR, calendar, CALENDAR_TYPES)

	let parser = parserFor(resolved.type)
	let body = await fetchSourceBody(resolved.href, signal, 'Calendar', parser.format)
	return parser.parse(body)
}

export const namedCalendarOptions = (
	calendar: NamedCalendar,
	options: {eventMapper?: EventMapper} = {},
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		// A remote calendar's name IS its source id, so tagging needs no new
		// argument.
		select: (events): SourcedEvent[] =>
			convertEvents(events, options).map((event) => ({
				sourceId: calendar,
				key: eventKey(event),
				event,
			})),
	})

export const namedCalendarEventOptions = (
	calendar: NamedCalendar,
	key: string,
	options: {eventMapper?: EventMapper} = {},
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[2], signal),
		select: (events) => convertEvents(events, options).find((event) => eventKey(event) === key),
	})

/**
 * One device event, by EventKit id. Reaches a month either side of today
 * rather than the list's forward-only month: a deep link, or a list still
 * showing yesterday's section, can name an event the forward window has
 * already passed.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const deviceCalendarEventOptions = (calendarId: string, eventId: string) =>
	queryOptions({
		queryKey: ['calendar', 'device', calendarId, eventId] as const,
		queryFn: async () => {
			let start = moment().startOf('day').subtract(1, 'month').toDate()
			let end = moment().startOf('day').add(1, 'month').toDate()
			let events = await listDeviceEvents(start, end, [calendarId])
			return events.find((entry) => entry.id === eventId)?.event
		},
	})

/**
 * Whether EventKit has already granted full calendar access. A query, so that
 * the three components asking for calendar sources on one screen -- the
 * picker, the list, and the detail screen -- read a single answer: the grant
 * is won inside the picker, and per-component state leaves the other two
 * believing there is still no access. React Query also drops a stale in-flight
 * check rather than letting it land on newer state.
 *
 * Only ever *checks*. Asking is `requestFullCalendarAccess`, called from an
 * explicit tap, and the caller leaves this query disabled outside dev mode, so
 * a production build never reaches EventKit at all.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const calendarAccessOptions = () =>
	queryOptions({
		queryKey: ['calendar', 'device-access'] as const,
		queryFn: async () => {
			let access = await getFullCalendarAccess()
			return access.granted
		},
	})

/**
 * The device's calendars, as sources. A query rather than component state:
 * it is read from the device like anything else here, and both the picker and
 * the detail screen need it, so neither should own it.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const deviceCalendarsOptions = () =>
	queryOptions({
		queryKey: ['calendar', 'device-calendars'] as const,
		queryFn: async () => {
			let calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT)
			return calendars.map((calendar) => toDeviceSource(calendar))
		},
	})

/**
 * A month from today. EventKit will return years of events, and the list draws
 * a section per day with no pagination behind it.
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const deviceCalendarOptions = (calendarId: string) =>
	queryOptions({
		queryKey: ['calendar', 'device', calendarId] as const,
		queryFn: () => {
			let start = moment().startOf('day').toDate()
			let end = moment().startOf('day').add(1, 'month').toDate()
			return listDeviceEvents(start, end, [calendarId])
		},
		// EventKit gives a real event id; better than `startTime|title`, and it is
		// what the detail screen looks the event back up by.
		select: (events): SourcedEvent[] =>
			events.map((entry) => ({
				sourceId: deviceSourceId(calendarId),
				key: entry.id,
				event: entry.event,
			})),
	})
