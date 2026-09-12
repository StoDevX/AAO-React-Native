import {fetchManifest, fetchSourceBody, REL_CALENDAR, resolveSource} from '@frogpond/data-sources'
import {eventKey} from '@frogpond/event-list/calendar-util'
import {queryOptions} from '@tanstack/react-query'
import * as Sentry from '@sentry/react-native'
import * as Calendar from 'expo-calendar'
import moment from 'moment'
import {now as currentMoment} from '@frogpond/timer'
import {queryClient} from '../../source/init/tanstack-query'
import {getRunner} from '../../source/database/client'
import {bumpCalendarRevision} from '../../source/database/calendar/revision'
import {retentionFor, writeSource} from '../../source/database/calendar/write'
import {convertEvents, type EventMapper} from './convert'
import {getFullCalendarAccess, listDeviceEvents} from './device-calendar'
import uitestFixtures from './fixtures/uitest-events.json'
import {parseEvents, type WireEvent} from './parsers/events'
import {parseIcalEvents} from './parsers/ical'
import {parsePresenceEvents} from './parsers/presence'
import {parseTecEvents} from './parsers/tec-events'
import {deviceSourceId, REMOTE_SOURCES, toDeviceSource, type SourcedEvent} from './sources'
import {NamedCalendar} from './types'

export const keys = {
	named: (name: string) => ['calendar', 'named', name] as const,
}

const TEC_EVENTS = 'application/vnd.tribe.events.v1+json'
const FROGPOND_EVENTS = 'application/vnd.frogpond.events+json'
const ICAL_EVENTS = 'text/calendar'
const PRESENCE_EVENTS = 'application/vnd.presence.events+json'

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
	[PRESENCE_EVENTS]: {format: 'json', parse: parsePresenceEvents},
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

/**
 * Where a source's rows land in dedupe order -- `REMOTE_SOURCES`' own order,
 * because that is what decides which copy of a duplicated event survives (the
 * campus calendar over Presence). An id `REMOTE_SOURCES` does not list gets a
 * rank past the end of it rather than 0: silently ranking an unknown source
 * first would let it outrank St. Olaf. Exported so the rule can be tested
 * directly rather than only through a full fetch-and-write.
 */
export function sourceRankOf(sourceId: string): number {
	let index = REMOTE_SOURCES.findIndex((source) => source.id === sourceId)
	return index === -1 ? REMOTE_SOURCES.length : index
}

/**
 * Fetches a remote calendar and writes it into the database -- the calendar
 * screens read from `source/database/calendar/read.ts`, not from this query's
 * own data, so what it resolves to is a receipt of the write rather than the
 * events themselves.
 */
export const namedCalendarOptions = (
	calendar: NamedCalendar,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: keys.named(calendar),
		queryFn: async ({queryKey, signal}): Promise<{writtenAt: number; count: number}> => {
			let wire = await fetchCalendar(queryKey[2], signal)

			try {
				writeSource(
					getRunner(),
					queryKey[2],
					sourceRankOf(queryKey[2]),
					wire,
					retentionFor(new Date()),
				)
				bumpCalendarRevision()
			} catch (error) {
				// The one failure here that is invisible: the revision does not
				// bump, so the screen keeps showing the previous window and the
				// user sees nothing wrong. Rethrow as well, so React Query marks
				// the source failed and the picker names it.
				Sentry.captureException(error)
				throw error
			}

			return {writtenAt: Date.now(), count: wire.length}
		},
	})

/**
 * KSTO's and KRLX's broadcast schedules are fetched through the same wire
 * format as a campus calendar but are not part of it -- `ScheduleView` draws
 * them from a plain fetch, never from the database `namedCalendarOptions`
 * above writes into, so they keep the convert-and-tag `select` that query
 * used to run, under a query key of their own rather than sharing
 * `namedCalendarOptions`' key with a different fetched shape.
 *
 * The key deliberately does not start with `'calendar'`: `tanstack-query.ts`'s
 * `shouldDehydrateQuery` excludes that whole prefix from persistence because
 * the campus calendar's data lives in SQLite, not in this query's own cache --
 * a schedule's events are not in the database, so they keep being persisted.
 */
export const scheduleCalendarOptions = (
	calendar: NamedCalendar,
	options: {eventMapper?: EventMapper} = {},
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: ['schedule', calendar] as const,
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[1], signal),
		// A remote calendar's name IS its source id, so tagging needs no new
		// argument. Filter out events that have already ended.
		select: (events): SourcedEvent[] => {
			let now = currentMoment()
			return convertEvents(events, options)
				.filter((event) => event.endTime.isAfter(now))
				.map((event) => ({
					sourceId: calendar,
					key: eventKey(event),
					event,
				}))
		},
	})

/**
 * One event out of a KSTO/KRLX broadcast schedule, by the same
 * `startTime|title` key a schedule row is listed under. Shares
 * `scheduleCalendarOptions`' query key on purpose: both run the identical
 * `fetchCalendar`, so a detail lookup reached from the schedule list costs no
 * extra fetch, and unlike `namedCalendarOptions`/`namedCalendarEventOptions`
 * before this task, neither side's `queryFn` return shape ever changes out
 * from under the other's `select`.
 */
export const scheduleEventOptions = (
	calendar: NamedCalendar,
	key: string,
	options: {eventMapper?: EventMapper} = {},
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: ['schedule', calendar] as const,
		queryFn: ({queryKey, signal}) => fetchCalendar(queryKey[1], signal),
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
