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

export function occurrencesQuery(args: {
	window: Window
	sourceIds: string[]
	filters: FilterSelection[]
}): Statement {
	let {window, sourceIds, filters} = args

	// One aliased join per filter, so several filters read as an AND. A single
	// join with an `in (...)` would match an event carrying *any* of them.
	let joins = filters
		.map(
			(_, index) =>
				`join event_tag f${index} on f${index}.source_id = e.source_id` +
				` and f${index}.event_key = e.event_key` +
				` and f${index}.axis = ? and f${index}.value = ?`,
		)
		.join('\n')

	let sql = `
select e.source_id, e.event_key, e.dedupe_key, e.wire, o.start_utc
from visible_event e
join occurrence o on o.source_id = e.source_id and o.event_key = e.event_key
${joins}
where e.source_id in (${placeholders(sourceIds.length)})
  and ${RANGE_PREDICATE}
order by o.start_utc`

	let params: BindValue[] = [
		...filters.flatMap((filter) => [filter.axis, filter.value]),
		...sourceIds,
		...rangeParams(window),
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
 * Counted across every source rather than over `visible_event`, deliberately.
 * A deduped event should count once, and a tag either copy contributes should
 * count — which is the same union the hydrated row applies.
 *
 * Sorted Z-A because SwiftUI's `Menu` renders its contents bottom-to-top, so
 * this reads A-Z on screen. See `source/features/calendar/filter.ts`.
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
order by t.value desc`

	return {sql, params: [axis, ...sourceIds, ...rangeParams(window)]}
}

/** Separator for `group_concat`. A unit separator cannot occur in a sponsor name. */
export const ORG_SEPARATOR = '\x1F'

/**
 * The sponsoring organisations for each of `dedupeKeys`, as one delimited
 * string per key.
 *
 * This is the cross-source union. Today `dedupeEvents` writes it into the
 * surviving event by hand, because both calendars name sponsors and each is
 * authoritative about the ones it lists — dropping the displaced copy's would
 * hide the event from a filter on an organisation that really does sponsor it.
 * Grouping tags by `dedupe_key` rather than by `event_key` *is* that union.
 *
 * Order matters and is asserted by a test: the winner's own names, in their own
 * order, then names only a displaced copy contributes. The `order by` sits
 * *inside* `group_concat` because an aggregate is not guaranteed to inherit a
 * subquery's ordering, even though SQLite happens to.
 */
export function organizationsQuery(dedupeKeys: string[]): Statement {
	let sql = `
select dedupe_key,
       group_concat(value, ? order by source_rank, tag_rowid) as orgs
from (
  select e.dedupe_key as dedupe_key, t.value as value,
         e.source_rank as source_rank, t.rowid as tag_rowid
  from event_tag t
  join event e on e.source_id = t.source_id and e.event_key = t.event_key
  where t.axis = 'organization'
    and e.dedupe_key in (${placeholders(dedupeKeys.length)})
)
group by dedupe_key`

	return {sql, params: [ORG_SEPARATOR, ...dedupeKeys]}
}
