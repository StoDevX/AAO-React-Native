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
 * `count(distinct e.dedupe_key)` behind an `exists` subquery rather than a
 * join to `occurrence`: joining returns one row per occurrence, so an event
 * recurring twice inside the window would be counted twice, and the tally has
 * to answer "how many events would this leave me".
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
