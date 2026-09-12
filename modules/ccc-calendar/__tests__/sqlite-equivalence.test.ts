import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import moment, {type Moment} from 'moment'

import {dedupeKey, eventKey} from '@frogpond/event-list/calendar-util'

import {hydrate, type OccurrenceRowResult} from '../../../source/database/calendar/hydrate'
import {
	occurrencesQuery,
	ORG_SEPARATOR,
	organizationsQuery,
	type Window,
} from '../../../source/database/calendar/queries'
import {toRows, type SourceRows} from '../../../source/database/calendar/rows'
import {ensureSchema} from '../../../source/database/schema'
import type {SqlRunner} from '../../../source/database/sql'
import {openTestDatabase} from '../../../source/database/testing/harness'
import {convertEvents} from '../convert'
import type {WireEvent} from '../parsers/events'
import {parseIcalEvents} from '../parsers/ical'
import {parsePresenceEvents} from '../parsers/presence'
import {parseTecEvents} from '../parsers/tec-events'
import type {SourcedEvent} from '../sources'
import presenceFixture from './fixtures/presence-events.json'
import tecFixture from './fixtures/tec-events.json'

const icalFixture = readFileSync(join(__dirname, 'fixtures/ical.ics'), 'utf8')

// This is the project's substantiating test: the database path (`toRows` ->
// SQLite -> `occurrencesQuery` -> `organizationsQuery` -> `hydrate`) must
// produce the same `SourcedEvent[]` the deleted array path did (`convertEvents`
// -> filter ended -> tag -> `dedupeEvents`), for real fixture data from every
// parser. Everything else in this project is tested in pieces; this is the
// only place the finished pipeline is checked against the one it replaced.
//
// -----------------------------------------------------------------------
// Frozen reference implementation -- DO NOT IMPORT ELSEWHERE, DO NOT SHARE.
//
// `dedupeEvents` and the convert/filter/tag steps below are faithful copies
// of code Task 9 deleted: `dedupeEvents` from
// `modules/ccc-calendar/use-merged-events.ts`, and `namedCalendarOptions`'s
// `select` from `modules/ccc-calendar/query.ts`, both as of commit
// 069480f72 (`git show 069480f72:modules/ccc-calendar/use-merged-events.ts`,
// `git show 069480f72:modules/ccc-calendar/query.ts`).
//
// This section exists only so this file has something independent to compare
// the database path against. It must never be imported by application code,
// and it must never be "tidied" to share helpers with the new path below --
// the two sides were written independently, and the test's whole value is
// that they still agree. Sharing code between them would make the test
// compare the new pipeline against itself.
//
// `eventKey`/`dedupeKey` and `convertEvents` are NOT part of this frozen
// section: they were never deleted, and the new path (`rows.ts`, `hydrate.ts`)
// imports the exact same functions today. Re-declaring them here would not
// make the comparison more independent -- it would just let the two copies
// drift apart, which is a different failure mode than the one this test
// exists to catch.
// -----------------------------------------------------------------------

/**
 * One row per event, where more than one calendar carries it. The first
 * occurrence wins, and the caller concatenates in source order, so the
 * winner is whichever source it lists first. The one thing a survivor takes
 * from the copy it displaces is the sponsoring organisations that copy names
 * and it does not.
 *
 * Frozen copy of `dedupeEvents`, `modules/ccc-calendar/use-merged-events.ts`
 * as of 069480f72.
 */
function dedupeEvents(events: SourcedEvent[]): SourcedEvent[] {
	let survivors = new Map<string, SourcedEvent>()

	for (let entry of events) {
		let key = dedupeKey(entry.event)
		let survivor = survivors.get(key)

		if (!survivor) {
			survivors.set(key, entry)
			continue
		}

		let sponsors = survivor.event.organization ?? []
		let gained = (entry.event.organization ?? []).filter((name) => !sponsors.includes(name))

		if (gained.length > 0) {
			survivors.set(key, {
				...survivor,
				event: {...survivor.event, organization: [...sponsors, ...gained]},
			})
		}
	}

	return [...survivors.values()]
}

/**
 * Frozen copy of `namedCalendarOptions`'s `select`,
 * `modules/ccc-calendar/query.ts` as of 069480f72: convert the wire events,
 * drop the ones that have already ended, and tag each with the source it
 * came from.
 */
function oldPathSelect(wire: WireEvent[], sourceId: string, now: Moment): SourcedEvent[] {
	return convertEvents(wire, {})
		.filter((event) => event.endTime.isAfter(now))
		.map((event) => ({sourceId, key: eventKey(event), event}))
}

/** The full old path: parse (by the caller) -> convert -> filter -> tag -> dedupe. */
function runOldPath(sources: {sourceId: string; wire: WireEvent[]}[], now: Date): SourcedEvent[] {
	let nowMoment = moment(now)
	return dedupeEvents(
		sources.flatMap(({sourceId, wire}) => oldPathSelect(wire, sourceId, nowMoment)),
	)
}

// -----------------------------------------------------------------------
// New path glue -- this is the real production plumbing (`toRows`,
// `occurrencesQuery`, `organizationsQuery`, `hydrate`), wired up the same way
// `source/database/calendar/read.ts`'s `useOccurrences` wires it up. It is
// deliberately NOT imported from `read.ts`: that file also imports
// `getRunner` from `client.ts`, which reaches for `expo-sqlite` and cannot
// load under Jest. So the two lines of glue connecting these functions
// (splitting `organizationsQuery`'s delimited string, building the insert
// statements `toRows`'s rows need) are duplicated here rather than shared --
// they carry no pipeline decisions of their own, unlike everything above.
// -----------------------------------------------------------------------

function freshDb(): SqlRunner {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	return runner
}

function insertRows(runner: SqlRunner, rows: SourceRows): void {
	for (let event of rows.events) {
		runner.run({
			sql: `insert into event (source_id, event_key, source_rank, dedupe_key, title, location, wire)
values (?,?,?,?,?,?,?)`,
			params: [
				event.sourceId,
				event.eventKey,
				event.sourceRank,
				event.dedupeKey,
				event.title,
				event.location,
				event.wire,
			],
		})
	}
	for (let occurrence of rows.occurrences) {
		runner.run({
			sql: `insert into occurrence (source_id, event_key, all_day, start_utc, end_utc, start_date, end_date)
values (?,?,?,?,?,?,?)`,
			params: [
				occurrence.sourceId,
				occurrence.eventKey,
				occurrence.allDay ? 1 : 0,
				occurrence.startUtc,
				occurrence.endUtc,
				occurrence.startDate,
				occurrence.endDate,
			],
		})
	}
	for (let tag of rows.tags) {
		runner.run({
			sql: 'insert into event_tag (source_id, event_key, axis, value) values (?,?,?,?)',
			params: [tag.sourceId, tag.eventKey, tag.axis, tag.value],
		})
	}
}

function writeToDb(runner: SqlRunner, sourceId: string, rank: number, wire: WireEvent[]): void {
	insertRows(runner, toRows(sourceId, rank, wire))
}

/** `organizationsQuery`'s delimited `orgs` column, split into the map `hydrate` expects -- same as `read.ts`'s own `sponsorMap`. */
function sponsorsFrom(rows: {dedupe_key: string; orgs: string}[]): Map<string, string[]> {
	return new Map(rows.map((row) => [row.dedupe_key, row.orgs.split(ORG_SEPARATOR)]))
}

/** `now`'s own calendar date, read in local time -- matches how `write.ts`/`read.ts` compute "today" for their own boundaries. */
function localDateOf(date: Date): string {
	let year = date.getFullYear()
	let month = String(date.getMonth() + 1).padStart(2, '0')
	let day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const FAR_FUTURE_UTC = Date.UTC(9999, 0, 1)
const FAR_FUTURE_DATE = '9999-01-01'

/**
 * A window from `now` to the end of time -- everything the deleted
 * `namedCalendarOptions`'s `select` also allowed through, since its only
 * filter was `endTime.isAfter(now)`, with no back edge (no retention) and no
 * forward edge. Setting `fromUtc`/`fromDate` to `now` reproduces "ends after
 * now" exactly, via `RANGE_PREDICATE`'s own start/end comparisons; the far
 * future upper bound reproduces "no forward limit". This is deliberately
 * not `dayWindow(now)` -- that function's bounded retention window is a
 * different, separately tested feature, and using it here would fold that
 * feature's own edges into a test that is supposed to be about the
 * conversion pipeline alone.
 */
function windowFrom(now: Date): Window {
	return {
		fromUtc: now.getTime(),
		toUtc: FAR_FUTURE_UTC,
		fromDate: localDateOf(now),
		toDate: FAR_FUTURE_DATE,
	}
}

/** The full new path: `writeToDb` (by the caller) -> `occurrencesQuery` -> `organizationsQuery` -> `hydrate`. */
function runNewPath(
	runner: SqlRunner,
	window: Window,
	sourceIds: string[],
	now: Date,
): SourcedEvent[] {
	let rows = runner.all<OccurrenceRowResult>(occurrencesQuery({window, sourceIds, filters: []}))
	let dedupeKeys = [...new Set(rows.map((row) => row.dedupe_key))]
	let sponsors =
		dedupeKeys.length === 0
			? new Map<string, string[]>()
			: sponsorsFrom(runner.all<{dedupe_key: string; orgs: string}>(organizationsQuery(dedupeKeys)))
	return hydrate(rows, sponsors, now)
}

// -----------------------------------------------------------------------
// Comparison -- field by field, not one `toEqual` over the whole array, so a
// mismatch names the field that diverged instead of dumping two large
// objects.
// -----------------------------------------------------------------------

function expectField(key: string, field: string, actual: unknown, expected: unknown): void {
	try {
		expect(actual).toEqual(expected)
	} catch (error) {
		let message = error instanceof Error ? error.message : String(error)
		throw new Error(`event "${key}", field "${field}" diverged:\n${message}`)
	}
}

function assertPipelinesAgree(
	oldEvents: SourcedEvent[],
	newEvents: SourcedEvent[],
	options: {compareIsOngoing: boolean},
): void {
	let byKey = (a: SourcedEvent, b: SourcedEvent) => a.key.localeCompare(b.key)
	let sortedOld = [...oldEvents].sort(byKey)
	let sortedNew = [...newEvents].sort(byKey)

	// Same identities on both sides before comparing anything about them --
	// a length or key mismatch shows up here, as an ordinary array diff,
	// rather than surfacing later as a confusing index-shifted field
	// mismatch.
	expect(sortedNew.map((event) => event.key)).toEqual(sortedOld.map((event) => event.key))

	sortedOld.forEach((old, index) => {
		let fresh = sortedNew[index]
		if (!fresh) throw new Error(`new path is missing event "${old.key}"`)
		let key = old.key

		expectField(key, 'sourceId', fresh.sourceId, old.sourceId)
		expectField(key, 'title', fresh.event.title, old.event.title)
		expectField(key, 'description', fresh.event.description, old.event.description)
		expectField(key, 'location', fresh.event.location, old.event.location)
		expectField(
			key,
			'startTime',
			fresh.event.startTime.toISOString(),
			old.event.startTime.toISOString(),
		)
		expectField(key, 'endTime', fresh.event.endTime.toISOString(), old.event.endTime.toISOString())
		expectField(key, 'isAllDay', fresh.event.isAllDay, old.event.isAllDay)
		expectField(key, 'isMultiDay', fresh.event.isMultiDay, old.event.isMultiDay)
		expectField(key, 'isSameInstant', fresh.event.isSameInstant, old.event.isSameInstant)
		expectField(key, 'links', fresh.event.links, old.event.links)
		expectField(key, 'categories', fresh.event.categories, old.event.categories)
		expectField(key, 'organization', fresh.event.organization, old.event.organization)
		expectField(key, 'config', fresh.event.config, old.event.config)

		// The one sanctioned divergence: the old path freezes `isOngoing` at
		// parse time, and the new path derives it from whatever `now` is
		// passed to `hydrate`. Callers pass the same `now` to both sides for
		// every case except the one below built to demonstrate that.
		if (options.compareIsOngoing) {
			expectField(key, 'isOngoing', fresh.event.isOngoing, old.event.isOngoing)
		}
	})
}

// -----------------------------------------------------------------------
// Cases
// -----------------------------------------------------------------------

test('TEC fixture: timed and all-day events match after sorting by key', () => {
	let now = new Date('2026-09-05T15:00:00Z')
	let wire = parseTecEvents(tecFixture, now)

	let db = freshDb()
	writeToDb(db, 'stolaf', 0, wire)

	let window = windowFrom(now)
	let oldEvents = runOldPath([{sourceId: 'stolaf', wire}], now)
	let newEvents = runNewPath(db, window, ['stolaf'], now)

	assertPipelinesAgree(oldEvents, newEvents, {compareIsOngoing: true})

	// Confirms this actually exercised an all-day event and not only timed
	// ones -- TEC encodes an all-day span as campus midnight expressed in
	// UTC, the encoding this project's worst bug hid in.
	expect(oldEvents.some((event) => event.event.isAllDay)).toBe(true)
	expect(oldEvents.some((event) => !event.event.isAllDay)).toBe(true)
})

test('Presence fixture: always-timed, sponsor-tagged events match after sorting by key', () => {
	let now = new Date('2026-09-12T15:00:00Z')
	let wire = parsePresenceEvents(presenceFixture, now)

	let db = freshDb()
	writeToDb(db, 'presence', 0, wire)

	let window = windowFrom(now)
	let oldEvents = runOldPath([{sourceId: 'presence', wire}], now)
	let newEvents = runNewPath(db, window, ['presence'], now)

	assertPipelinesAgree(oldEvents, newEvents, {compareIsOngoing: true})

	// Presence never emits an all-day event -- confirm the fixture actually
	// carries the timed encoding this case means to check, and that every
	// event kept its one sponsoring organisation.
	expect(oldEvents.length).toBeGreaterThan(0)
	expect(oldEvents.every((event) => event.event.isAllDay === false)).toBe(true)
	expect(oldEvents.every((event) => (event.event.organization ?? []).length === 1)).toBe(true)
})

test('iCal fixture: recurring weekly events match after sorting by key', () => {
	// Same fixture and `now` as `ical.test.ts`'s own live-fixture case: a
	// real KSTO show schedule, six weekly-recurring masters expanding to 70-80
	// occurrences across the 90-day window from `now`.
	let now = new Date('2026-08-15T12:00:00Z')
	let wire = parseIcalEvents(icalFixture, now)

	let db = freshDb()
	writeToDb(db, 'stolaf', 0, wire)

	let window = windowFrom(now)
	let oldEvents = runOldPath([{sourceId: 'stolaf', wire}], now)
	let newEvents = runNewPath(db, window, ['stolaf'], now)

	expect(oldEvents.length).toBeGreaterThanOrEqual(70)
	assertPipelinesAgree(oldEvents, newEvents, {compareIsOngoing: true})
})

test('the sponsor union matches when the same event is duplicated across two sources', () => {
	let now = new Date('2026-09-20T12:00:00Z')

	function gameWireEvent(organization: string[]): WireEvent {
		return {
			dataSource: 'test',
			startTime: '2026-09-25T18:00:00Z',
			endTime: '2026-09-25T20:00:00Z',
			isAllDay: false,
			isMultiDay: false,
			isSameInstant: false,
			title: "Men's Soccer vs. Carroll University",
			description: '',
			location: 'Manitou Field',
			isOngoing: false,
			links: [],
			categories: ['Athletics'],
			organization,
			config: {startTime: true, endTime: true, subtitle: 'location'},
		}
	}

	// Both sources describe the same real-world game -- same title, same
	// instant, so the same `dedupeKey` -- and each names a sponsor the other
	// does not, but they also agree on one: "Campus Rec", named by both.
	// `stolaf` is rank 0, so it is the survivor/winner on both paths; the
	// union should carry its own two names first, in their own order, then
	// only the name `presence` contributes that `stolaf` didn't already
	// name -- "Campus Rec" must appear once, not twice, the same way the
	// deleted `dedupeEvents` never double-listed a sponsor both copies named.
	let winner = gameWireEvent(['St. Olaf Athletics', 'Campus Rec'])
	let loser = gameWireEvent(['Campus Rec', 'Presence Rec'])

	let db = freshDb()
	writeToDb(db, 'stolaf', 0, [winner])
	writeToDb(db, 'presence', 1, [loser])

	let window = windowFrom(now)
	let oldEvents = runOldPath(
		[
			{sourceId: 'stolaf', wire: [winner]},
			{sourceId: 'presence', wire: [loser]},
		],
		now,
	)
	let newEvents = runNewPath(db, window, ['stolaf', 'presence'], now)

	expect(oldEvents).toHaveLength(1)
	expect(oldEvents[0]?.sourceId).toBe('stolaf')
	expect(oldEvents[0]?.event.organization).toEqual([
		'St. Olaf Athletics',
		'Campus Rec',
		'Presence Rec',
	])

	assertPipelinesAgree(oldEvents, newEvents, {compareIsOngoing: true})
})

test('isOngoing is the one deliberate divergence: frozen on the old path, derived from `now` on the new one', () => {
	// TEC's own "Orientation for new students" (2026-09-04 to 2026-09-10,
	// all-day) is genuinely running at `now` below -- started before today,
	// ends after now -- so both paths agree it is ongoing at parse time.
	let now = new Date('2026-09-05T15:00:00Z')
	let wire = parseTecEvents(tecFixture, now)

	let db = freshDb()
	writeToDb(db, 'stolaf', 0, wire)

	let window = windowFrom(now)
	let rows = db.all<OccurrenceRowResult>(
		occurrencesQuery({window, sourceIds: ['stolaf'], filters: []}),
	)
	let dedupeKeys = [...new Set(rows.map((row) => row.dedupe_key))]
	let sponsors = sponsorsFrom(db.all(organizationsQuery(dedupeKeys)))

	// The old path's list is built once, here, and never rebuilt below --
	// exactly like production, where it was frozen the moment the feed was
	// parsed.
	let oldEvents = runOldPath([{sourceId: 'stolaf', wire}], now)
	let newAtParseTime = hydrate(rows, sponsors, now)

	// Case 1: the same instant on both sides. `isOngoing` agrees everywhere,
	// so every other field can be asserted strictly at the same time.
	assertPipelinesAgree(oldEvents, newAtParseTime, {compareIsOngoing: true})

	let orientationThen = oldEvents.find(
		(event) => event.event.title === 'Orientation for new students',
	)
	if (!orientationThen) throw new Error('fixture no longer contains the expected ongoing event')
	expect(orientationThen.event.isOngoing).toBe(true)

	// Case 2: a later `now`, applied only to the new path's `hydrate` step --
	// `oldEvents` above is never recomputed, because in production it never
	// would be. By 2026-09-11, "Orientation for new students" has finished
	// (it ended 2026-09-10), so the new path's fresh answer is `false`; the
	// old path's frozen answer stays `true`.
	let later = new Date('2026-09-11T15:00:00Z')
	let newAtLaterTime = hydrate(rows, sponsors, later)

	let orientationStale = oldEvents.find(
		(event) => event.event.title === 'Orientation for new students',
	)
	let orientationFresh = newAtLaterTime.find(
		(event) => event.event.title === 'Orientation for new students',
	)
	if (!orientationStale || !orientationFresh) {
		throw new Error('fixture no longer contains the expected event')
	}

	expect(orientationStale.event.isOngoing).toBe(true)
	expect(orientationFresh.event.isOngoing).toBe(false)

	// Every other field must still agree -- the divergence is isolated to
	// `isOngoing`, not a side effect of something else drifting too.
	assertPipelinesAgree(oldEvents, newAtLaterTime, {compareIsOngoing: false})
})
