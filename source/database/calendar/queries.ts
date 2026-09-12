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
