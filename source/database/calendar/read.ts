import type {EventType} from '@frogpond/event-type'
import * as Sentry from '@sentry/react-native'
import {keepPreviousData, useQuery} from '@tanstack/react-query'

import type {SourcedEvent} from '../../../modules/event-list/types.ts'
import type {CalendarFilterOption} from '../../features/calendar/filter.ts'
import {getRunner} from '../client.ts'
import type {SqlRunner} from '../sql.ts'
import {hydrate, type OccurrenceRowResult} from './hydrate.ts'
import {
	facetsQuery,
	occurrencesQuery,
	oneEventQuery,
	ORG_SEPARATOR,
	organizationsQuery,
	type FilterSelection,
	type Window,
} from './queries.ts'
import {useCalendarRevision} from './revision.ts'
import {RETENTION_DAYS} from './write.ts'

/**
 * How far past `today` the window reaches. Unlike `RETENTION_DAYS`, nothing
 * on the write side prunes future rows -- the upstream feed simply stops
 * describing events past its own horizon -- so there is no shared constant to
 * import here.
 */
const FORWARD_DAYS = 180

/**
 * The head every query key in this module carries.
 *
 * `source/init/tanstack-query.ts` keeps the whole `calendar` prefix out of
 * AsyncStorage, because what these queries return -- `SourcedEvent`s holding
 * `Moment`s -- does not survive a JSON round-trip: `JSON.stringify` flattens a
 * `Moment` to an ISO string and `JSON.parse` restores a string, so a restored
 * entry crashes the first thing that calls a `Moment` method on it. Persisting
 * a hydrated window would also rebuild, in AsyncStorage, the JSON blob this
 * whole database exists to replace.
 *
 * A read hook added here keys on this constant rather than spelling a head of
 * its own. That is what keeps it excluded; a head invented at the call site is
 * how all three hooks below came to be persisted in the first place.
 */
export const CALENDAR_READ_KEY = 'calendar-db'

/** A `YYYY-MM-DD` string for a `Date`, read in local time -- matches `write.ts`'s own `localDate`. */
function localDate(date: Date): string {
	let year = date.getFullYear()
	let month = String(date.getMonth() + 1).padStart(2, '0')
	let day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * The two-sided window the screens read from: `RETENTION_DAYS` back, `FORWARD_DAYS`
 * forward, floored to today's local midnight.
 *
 * Floored to the day, not the instant, and this is load-bearing:
 * `app/(home)/Calendar.tsx` gets `now` from `useMomentTimer({intervalMs: 60000})`,
 * so an unfloored window would mint a new query key -- and force a requery and a
 * full rehydrate -- once a minute. Flooring means every call within the same
 * local day returns a window that is `toEqual` the last one: a fresh object
 * each time, but equal by value, which is what the read hooks below key their
 * queries on (never on this object's own identity).
 *
 * The back edge imports `RETENTION_DAYS` from `write.ts` rather than
 * re-declaring 30, and computes it with the same "today's local midnight,
 * minus N days" arithmetic `retentionFor` uses -- so on any given day this
 * window's `fromDate`/`fromUtc` are numerically identical to that same day's
 * retention cutoff. That equality is what matters: a window that reached back
 * *less* than retention would ask for days the write already pruned and find
 * nothing; a window that reached back *more* would ask for days retention
 * never promised to keep. Matching exactly is the only choice that is safe in
 * both directions.
 */
export function dayWindow(now: Date): Window {
	let today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

	let from = new Date(today)
	from.setDate(from.getDate() - RETENTION_DAYS)

	let to = new Date(today)
	to.setDate(to.getDate() + FORWARD_DAYS)

	return {
		fromUtc: from.getTime(),
		toUtc: to.getTime(),
		fromDate: localDate(from),
		toDate: localDate(to),
	}
}

/**
 * `organizationsQuery`'s delimited `orgs` column, split back into the map
 * `hydrate` expects. Exported so the split itself -- the part of
 * `sponsorsFor` that is genuinely decided in JavaScript, rather than by
 * SQLite -- can be tested directly.
 */
export function sponsorMap(rows: {dedupe_key: string; orgs: string}[]): Map<string, string[]> {
	return new Map(rows.map((row) => [row.dedupe_key, row.orgs.split(ORG_SEPARATOR)]))
}

/**
 * The sponsors for each of `dedupeKeys`, as the map `hydrate` expects.
 *
 * `sourceIds` narrows the union to the calendars that are on, matching the
 * scoping `occurrencesQuery` applies to the dedupe itself: a sponsor named
 * only by a switched-off calendar is a name the filter menu never offers.
 *
 * `organizationsQuery` binds `dedupeKeys` into an `in (...)` clause; with an
 * empty list that becomes `in ()`. Measured against real SQLite: that is
 * *not* an error -- it is a valid, always-false predicate, and the query
 * just returns zero rows. The guard below skips the query anyway, because a
 * window with no events in range (first launch, offline) already knows the
 * answer is empty; running the statement would only pay for a prepare and an
 * execute to learn what we already know. Exported so that skip can be tested
 * against a runner that would fail the test if it were ever reached.
 */
export function sponsorsFor(
	runner: SqlRunner,
	dedupeKeys: string[],
	sourceIds: string[],
): Map<string, string[]> {
	if (dedupeKeys.length === 0) return new Map()

	let rows = runner.all<{dedupe_key: string; orgs: string}>(
		organizationsQuery(dedupeKeys, sourceIds),
	)
	return sponsorMap(rows)
}

/**
 * Runs a read, reporting anything it throws before letting it through.
 *
 * A read here can fail for reasons nothing upstream can see: a corrupt page
 * that survives `openDatabaseSync`, a throw inside `ensureSchema`, a `wire`
 * column `JSON.parse` chokes on. Left unreported and unpropagated, every one
 * of those looks identical to an empty database -- the screen says "No
 * events." while `useMergedEvents` reports the network perfectly healthy, and
 * nothing the user presses helps. Reporting matches what the write path
 * already does for the same hazard (`modules/ccc-calendar/query.ts`);
 * rethrowing is what marks the query failed, so the screen can say so.
 *
 * Exported so the reporting and the rethrow can be asserted against a callback
 * that throws, rather than only through a hook that would need `expo-sqlite`
 * mocked into a thrower to reach.
 */
export function reportingFailures<T>(read: () => T): T {
	try {
		return read()
	} catch (error) {
		Sentry.captureException(error)
		throw error
	}
}

/**
 * Every occurrence in `window`, narrowed to `sourceIds` and `filters`,
 * hydrated into `SourcedEvent`s. `failed` says the read itself threw, which
 * the screen reports as every enabled calendar being unavailable.
 */
export function useOccurrences(args: {
	window: Window
	sourceIds: string[]
	filters: FilterSelection[]
}): {events: SourcedEvent[]; isPending: boolean; failed: boolean} {
	let {window, sourceIds, filters} = args
	let revision = useCalendarRevision()

	let result = useQuery({
		queryKey: [CALENDAR_READ_KEY, 'occurrences', revision, window, sourceIds, filters],
		queryFn: () =>
			reportingFailures(() => {
				let runner = getRunner()
				let rows = runner.all<OccurrenceRowResult>(occurrencesQuery({window, sourceIds, filters}))
				let dedupeKeys = [...new Set(rows.map((row) => row.dedupe_key))]
				let sponsors = sponsorsFor(runner, dedupeKeys, sourceIds)
				// Read once per query run, not per render: `hydrate` derives
				// `isOngoing` from it, so that flag is recomputed when a write
				// bumps the revision or the day-floored window moves, and not in
				// between. `sections.ts` re-checks the end time against its own
				// minute ticker, which is what keeps `Ongoing` honest.
				return hydrate(rows, sponsors, new Date())
			}),
		placeholderData: keepPreviousData,
	})

	return {events: result.data ?? [], isPending: result.isPending, failed: result.isError}
}

/**
 * Every value at least one event in `window` carries on `axis`, tallied.
 *
 * A failure here is reported but not surfaced: the filter menu offers nothing,
 * which is what it would show for a window with no tags in it anyway, and the
 * list beside it says whether the calendar could be read.
 */
export function useFacets(args: {
	axis: 'category' | 'organization'
	window: Window
	sourceIds: string[]
}): CalendarFilterOption[] {
	let {axis, window, sourceIds} = args
	let revision = useCalendarRevision()

	let result = useQuery({
		queryKey: [CALENDAR_READ_KEY, 'facets', revision, axis, window, sourceIds],
		queryFn: () =>
			reportingFailures(() =>
				getRunner().all<CalendarFilterOption>(facetsQuery({axis, window, sourceIds})),
			),
		placeholderData: keepPreviousData,
	})

	return result.data ?? []
}

/**
 * One event, named by its own `(sourceId, key)` rather than by `dedupe_key`.
 *
 * Runs `oneEventQuery` against `event` without ranking by `dedupe_key`: a deep
 * link names one specific source's copy, and it has to resolve even when
 * another source's copy won the dedupe.
 *
 * The sponsor union runs over `sourceIds` *plus this event's own source*. The
 * reader is looking at this copy, so the calendar carrying it contributes
 * whether or not it is switched on -- a deep link into a calendar the reader
 * has turned off would otherwise show the event with no sponsors at all.
 */
export function useEvent(
	sourceId: string,
	key: string,
	sourceIds: string[],
): {event: EventType | undefined; error: Error | null; refetch: () => void} {
	let revision = useCalendarRevision()

	let result = useQuery({
		queryKey: [CALENDAR_READ_KEY, 'event', revision, sourceId, key, sourceIds],
		queryFn: () =>
			reportingFailures(() => {
				let runner = getRunner()
				let rows = runner.all<OccurrenceRowResult>(oneEventQuery(sourceId, key))
				let sponsors = sponsorsFor(
					runner,
					rows.map((row) => row.dedupe_key),
					[sourceId, ...sourceIds],
				)
				let [entry] = hydrate(rows, sponsors, new Date())
				return entry?.event
			}),
		placeholderData: keepPreviousData,
	})

	return {
		event: result.data,
		error: result.error,
		refetch: () => void result.refetch(),
	}
}

/** `useOccurrences` over the timeline's own window, with no filter narrowing it. */
export function useNeighbours(args: {window: Window; sourceIds: string[]}): SourcedEvent[] {
	let {events} = useOccurrences({window: args.window, sourceIds: args.sourceIds, filters: []})
	return events
}
