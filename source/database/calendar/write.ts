import type {WireEvent} from '../../../modules/ccc-calendar/parsers/events.ts'
import type {SqlRunner} from '../sql.ts'
import type {EventRow, OccurrenceRow, TagRow} from './rows.ts'
import {toRows} from './rows.ts'

/**
 * How many days back a written row is kept once its occurrence has moved
 * into the past. The read side's window (`dayWindow`) must ask for exactly
 * this many days back too, from this same constant -- retention and the read
 * window are different things (what a write keeps versus what a read asks
 * for), and drift between them is silent: a shorter retention edge makes the
 * oldest rows vanish from a list still asking for them; a longer one
 * accumulates rows no query can ever reach.
 */
export const RETENTION_DAYS = 30

export type Retention = {
	todayUtc: number
	todayDate: string
	cutoffUtc: number
	cutoffDate: string
}

function localDate(date: Date): string {
	let year = date.getFullYear()
	let month = String(date.getMonth() + 1).padStart(2, '0')
	let day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * Today's local midnight, and the date `RETENTION_DAYS` before it -- the two
 * boundaries `writeSource` deletes against. Takes the clock as an argument
 * rather than reading it, so a test can pin "now" and assert an exact
 * boundary.
 */
export function retentionFor(now: Date): Retention {
	let today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	let cutoff = new Date(today)
	cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

	return {
		todayUtc: today.getTime(),
		todayDate: localDate(today),
		cutoffUtc: cutoff.getTime(),
		cutoffDate: localDate(cutoff),
	}
}

/**
 * Whether an occurrence starts before a boundary -- the same all-day/timed
 * split `RANGE_PREDICATE` (`queries.ts`) uses, but a single-point comparison
 * rather than a window overlap, which is what both deletes below need.
 *
 * This is a sibling of `RANGE_PREDICATE`, not a reuse of it: that predicate
 * always pairs an occurrence's start with a window's *upper* bound and its
 * end with the *lower* one, because it is answering "does this occurrence
 * overlap the window". Reusing it here would require the boundary this
 * module needs -- "does this occurrence start at or after the cutoff" -- to
 * be expressed as a start paired with a *lower* bound, which
 * `RANGE_PREDICATE`'s shape cannot give without also constraining the
 * occurrence's end (fixable only by binding a sentinel infinity/date to the
 * end side, trading one duplication for a more fragile one). Negating this
 * predicate (`not (${STARTS_BEFORE})`) gives "starts at or after the
 * boundary", so one constant still serves both deletes below.
 */
const STARTS_BEFORE = `(  (o.all_day = 0 and o.start_utc  < ?)
or (o.all_day = 1 and o.start_date < ?) )`

/**
 * Deletes this source's events whose occurrence does not violate `predicate`
 * -- i.e. every occurrence sits on the side of the boundary `predicate`
 * describes. `event_tag` and `occurrence` cascade with the `event` row, so
 * deleting from `event` alone is enough.
 */
function deleteWhere(
	runner: SqlRunner,
	sourceId: string,
	predicate: string,
	params: [number, string],
): void {
	runner.run({
		sql: `
delete from event
where source_id = ?
  and not exists (
    select 1 from occurrence o
    where o.source_id = event.source_id and o.event_key = event.event_key
      and ${predicate}
  )`,
		params: [sourceId, ...params],
	})
}

function insertEvent(runner: SqlRunner, row: EventRow): void {
	runner.run({
		sql: `insert into event (source_id, event_key, source_rank, dedupe_key, title, location, wire)
values (?,?,?,?,?,?,?)`,
		params: [
			row.sourceId,
			row.eventKey,
			row.sourceRank,
			row.dedupeKey,
			row.title,
			row.location,
			row.wire,
		],
	})
}

function insertOccurrence(runner: SqlRunner, row: OccurrenceRow): void {
	runner.run({
		sql: `insert into occurrence (source_id, event_key, all_day, start_utc, end_utc, start_date, end_date)
values (?,?,?,?,?,?,?)`,
		params: [
			row.sourceId,
			row.eventKey,
			row.allDay ? 1 : 0,
			row.startUtc,
			row.endUtc,
			row.startDate,
			row.endDate,
		],
	})
}

function insertTag(runner: SqlRunner, row: TagRow): void {
	runner.run({
		sql: 'insert into event_tag (source_id, event_key, axis, value) values (?,?,?,?)',
		params: [row.sourceId, row.eventKey, row.axis, row.value],
	})
}

/**
 * Updates one source's rows for a freshly parsed fetch: **replace-future,
 * prune-past**.
 *
 * The upstream feed only describes today forward, so a plain "delete this
 * source's rows, insert what arrived" would erase yesterday's events on
 * every refresh and the app's two-sided window would never have a back half.
 * Instead:
 *
 * 1. Delete this source's events whose occurrence sits at or after today --
 *    the feed's to-state, replaced wholesale.
 * 2. Delete this source's events whose occurrence sits before the retention
 *    cutoff -- the only thing that prunes old rows.
 * 3. Insert `wire`'s rows, skipping any event whose key survived step 1 as a
 *    retained past row -- inserting it again would collide with the row
 *    already in place.
 *
 * Everything runs inside one transaction, so a throw -- a fetch that failed
 * partway through parsing, a constraint violation -- leaves this source's
 * previous rows exactly as they were; a failing Presence fetch cannot blank
 * St. Olaf.
 *
 * Accepted cost: an event cancelled upstream after it has started lingers in
 * the past (it is neither future nor old enough to prune) until it ages out
 * past the retention cutoff. That is the price of filling the back window
 * without an ingest change.
 */
export function writeSource(
	runner: SqlRunner,
	sourceId: string,
	sourceRank: number,
	wire: WireEvent[],
	retention: Retention,
): void {
	runner.transaction(() => {
		deleteWhere(runner, sourceId, STARTS_BEFORE, [retention.todayUtc, retention.todayDate])
		deleteWhere(runner, sourceId, `not (${STARTS_BEFORE})`, [
			retention.cutoffUtc,
			retention.cutoffDate,
		])

		let retained = new Set(
			runner
				.all<{event_key: string}>({
					sql: 'select event_key from event where source_id = ?',
					params: [sourceId],
				})
				.map((row) => row.event_key),
		)

		let {events, occurrences, tags} = toRows(sourceId, sourceRank, wire)
		let isFresh = (eventKey: string): boolean => !retained.has(eventKey)

		let tagsByEventKey = new Map<string, TagRow[]>()
		for (let tag of tags) {
			let forEvent = tagsByEventKey.get(tag.eventKey) ?? []
			forEvent.push(tag)
			tagsByEventKey.set(tag.eventKey, forEvent)
		}

		// `toRows` produces exactly one occurrence per event, at the same
		// index, so an event's own row-family -- event, occurrence, tags --
		// is inserted together before moving to the next one. Insert order
		// matters for the FK (an occurrence needs its event row already
		// there); grouping it this way also means an event that fails a
		// constraint after some fresh rows are already in place fails with
		// genuine partial writes to roll back, not merely a partial write to
		// one table.
		events.forEach((event, index) => {
			if (!isFresh(event.eventKey)) return

			insertEvent(runner, event)
			insertOccurrence(runner, occurrences[index])
			for (let tag of tagsByEventKey.get(event.eventKey) ?? []) {
				insertTag(runner, tag)
			}
		})
	})
}
