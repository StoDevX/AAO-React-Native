import {placeholders, type BindValue, type Statement} from '../sql.ts'

export type Window = {fromUtc: number; toUtc: number; fromDate: string; toDate: string}
export type FilterSelection = {axis: 'category' | 'organization'; value: string}

/**
 * Whether an occurrence overlaps the window.
 *
 * Two arms, because the two kinds of occurrence are filtered on different
 * things: a timed event on its wire instants, an all-day event on its calendar
 * dates. An all-day event names a date, so comparing it as an instant would
 * place iCal's UTC midnight and the TEC feed's campus midnight on different
 * days. Parameter order is start/end for instants, then start/end for dates —
 * see `rangeParams`.
 */
export const RANGE_PREDICATE = `(  (o.all_day = 0 and o.start_utc  < ? and o.end_utc  > ?)
or (o.all_day = 1 and o.start_date < ? and o.end_date > ?) )`

export function rangeParams(window: Window): BindValue[] {
	return [window.toUtc, window.fromUtc, window.toDate, window.fromDate]
}

/**
 * The requested sources' events, one copy per `dedupe_key`.
 *
 * **The dedupe is scoped to `sourceIds`, inside the subquery that ranks, and
 * that placement is the whole of its correctness.** Ranking across every
 * stored event and narrowing to the requested sources afterwards deletes an
 * event outright whenever the winner belongs to a calendar that is off: the
 * winner fails the source clause, the loser was already suppressed by the
 * ranking, and nothing is left. Nor does it heal -- `writeSource` only runs for
 * a source whose query runs, so a disabled calendar's rows are never refreshed
 * or pruned and keep winning dedupes for as long as it stays off. It also
 * breaks the menu: `facetsQuery` counts over `event` and is source-scoped, so
 * it would offer a value that filters to nothing.
 *
 * Scoping it this way is what the deleted `dedupeEvents` did without having to
 * say so -- it was handed the enabled calendars' events and never saw any
 * others.
 *
 * The filters below match over the dedupe group rather than over the winning
 * row, for the same reason and with the same union. See the comment on them.
 */
export function occurrencesQuery(args: {
	window: Window
	sourceIds: string[]
	filters: FilterSelection[]
}): Statement {
	let {window, sourceIds, filters} = args

	// One `exists` per filter, ANDed, so several filters read as an AND -- a
	// single clause with an `in (...)` would match an event carrying *any* of
	// them.
	//
	// Each one matches over the **dedupe group**, not over the winning row.
	// For `organization`, group-wide matching reproduces the union `dedupeEvents`
	// wrote into the survivor, which `organizationsQuery` rebuilds and `hydrate`
	// prints. For `category`, it is broader than the old path on purpose: `facetsQuery`
	// tallies categories across all in-scope copies, so matching only the winner
	// would tally values that filter to nothing.
	let matches = filters
		.map(
			(_, index) =>
				`  and exists (
    select 1 from event_tag t${index}
    join event c${index} on c${index}.source_id = t${index}.source_id
      and c${index}.event_key = t${index}.event_key
    where c${index}.dedupe_key = e.dedupe_key
      and c${index}.source_id in (${placeholders(sourceIds.length)})
      and t${index}.axis = ? and t${index}.value = ?
  )`,
		)
		.join('\n')

	let sql = `
select e.source_id, e.event_key, e.dedupe_key, e.wire, o.start_utc
from (
  select *, row_number() over (partition by dedupe_key order by source_rank, event_key) rn
  from event
  where source_id in (${placeholders(sourceIds.length)})
) e
join occurrence o on o.source_id = e.source_id and o.event_key = e.event_key
where e.rn = 1
  and ${RANGE_PREDICATE}
${matches}
order by o.start_utc`

	// Bound in the order the placeholders appear in the SQL above: the ranking
	// subquery's source list, the window, then -- per filter, in order -- that
	// `exists` clause's own copy of the source list followed by its axis and
	// value. The source list appears once per filter as well as once up top, so
	// this sequence is longer than it looks; `queries.test.ts` counts the
	// assembled statement's placeholders rather than trusting the template.
	let params: BindValue[] = [
		...sourceIds,
		...rangeParams(window),
		...filters.flatMap((filter) => [...sourceIds, filter.axis, filter.value]),
	]

	return {sql, params}
}

/**
 * Every value at least one event in the window carries, tallied.
 *
 * `count(distinct e.dedupe_key)` is what keeps the tally honest, and it is
 * doing two jobs. It collapses an event with several occurrences in the
 * window, and — the case that actually needs it — it collapses one event
 * carried by two calendars where both tag it the same. A game listed by both
 * St. Olaf and Presence, each tagging it "Athletics", is one event to the
 * user, and the tally has to answer "how many events would this leave me" or
 * the menu's number disagrees with the list the filter produces. Measured:
 * that shape gives 1 under `count(distinct e.dedupe_key)` and 2 under
 * `count(*)`.
 *
 * The `exists` subquery rather than a join to `occurrence` is a **performance**
 * choice, not a correctness one — `count(distinct ...)` absorbs the row
 * multiplication a join would cause, so both spellings return the same
 * numbers. `exists` just stops SQLite materialising one row per occurrence
 * before the aggregate throws them away. Do not read the two as
 * interchangeable safety nets: only the `distinct` is load-bearing.
 *
 * Counted over every requested source's copy of an event rather than over the
 * winning copy alone, deliberately. A deduped event should count once — which
 * `count(distinct e.dedupe_key)` sees to — and a tag either copy contributes
 * should count, which is the same union the hydrated row applies.
 *
 * Sorted Z-A because SwiftUI's `Menu` renders its contents bottom-to-top, so
 * this reads A-Z on screen. See `source/features/calendar/filter.ts`.
 *
 * `collate nocase` because the deleted `tally` sorted with `localeCompare`,
 * where SQLite's default BINARY collation puts every capital ahead of every
 * lower-case letter -- so "athletics" sorted after "Zoology". This is closer
 * but not exact parity: `nocase` folds ASCII A-Z only, so accented and
 * non-Latin names still order by code point where `localeCompare` would order
 * them by the locale's rules.
 */
export function facetsQuery(args: {
	axis: 'category' | 'organization'
	window: Window
	sourceIds: string[]
}): Statement {
	let {axis, window, sourceIds} = args

	let sql = `
select t.value as value, count(distinct e.dedupe_key) as count
from event_tag t
join event e on e.source_id = t.source_id and e.event_key = t.event_key
where t.axis = ?
  and e.source_id in (${placeholders(sourceIds.length)})
  and exists (
    select 1 from occurrence o
    where o.source_id = e.source_id and o.event_key = e.event_key
      and ${RANGE_PREDICATE}
  )
group by t.value
order by t.value collate nocase desc`

	return {sql, params: [axis, ...sourceIds, ...rangeParams(window)]}
}

/** Separator for `group_concat`. A unit separator cannot occur in a sponsor name. */
export const ORG_SEPARATOR = '\x1F'

/**
 * The sponsoring organisations for each of `dedupeKeys`, as one delimited
 * string per key.
 *
 * This is the cross-source union. Both calendars name sponsors and each is
 * authoritative about the ones it lists — dropping the displaced copy's would
 * hide the event from a filter on an organisation that really does sponsor it.
 * Grouping tags by `dedupe_key` rather than by `event_key` *is* that union.
 *
 * The union is over `sourceIds`, for the same reason `occurrencesQuery`'s
 * dedupe is: a calendar that is off contributes nothing a reader can see. Left
 * unscoped, a switched-off calendar's sponsor would appear on a row shown from
 * another calendar — a name `facetsQuery` never offers and no filter matches.
 *
 * Order matters and is asserted by a test: the winner's own names, in their own
 * order, then names only a displaced copy contributes. The `order by` sits
 * *inside* `group_concat` because an aggregate is not guaranteed to inherit a
 * subquery's ordering, even though SQLite happens to.
 */
export function organizationsQuery(dedupeKeys: string[], sourceIds: string[]): Statement {
	let sql = `
select dedupe_key,
       group_concat(value, ? order by source_rank, tag_rowid) as orgs
from (
  select e.dedupe_key as dedupe_key, t.value as value,
         e.source_rank as source_rank, t.rowid as tag_rowid
  from event_tag t
  join event e on e.source_id = t.source_id and e.event_key = t.event_key
  where t.axis = 'organization'
    and e.source_id in (${placeholders(sourceIds.length)})
    and e.dedupe_key in (${placeholders(dedupeKeys.length)})
)
group by dedupe_key`

	return {sql, params: [ORG_SEPARATOR, ...sourceIds, ...dedupeKeys]}
}

/**
 * One event, named by its own `(source_id, event_key)` rather than by
 * `dedupe_key` -- a deep link names a specific source's copy, and it has to
 * resolve even when another source's copy won the dedupe. Ranking by
 * `dedupe_key`, as `occurrencesQuery` does, would 404 the losing copy's route;
 * this selects from `event` directly, so both copies of a duplicated event
 * stay reachable by their own key.
 *
 * `toRows` writes exactly one occurrence per event today, but the join (over
 * a plain equi-join, ordered and capped) is the same shape `occurrencesQuery`
 * would need if that ever changes, rather than assuming it never will.
 */
export function oneEventQuery(sourceId: string, eventKey: string): Statement {
	let sql = `
select e.source_id, e.event_key, e.dedupe_key, e.wire, o.start_utc
from event e
join occurrence o on o.source_id = e.source_id and o.event_key = e.event_key
where e.source_id = ? and e.event_key = ?
order by o.start_utc
limit 1`

	return {sql, params: [sourceId, eventKey]}
}
