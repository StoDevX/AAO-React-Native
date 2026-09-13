import type {EventType} from '@frogpond/event-type'
import {isAfter, isBefore, startOfDay} from 'date-fns'

import {convertEvents} from '../../../modules/ccc-calendar/convert.ts'
import type {WireEvent} from '../../../modules/ccc-calendar/parsers/events.ts'
import type {SourcedEvent} from '../../../modules/event-list/types.ts'

export type OccurrenceRowResult = {
	source_id: string
	event_key: string
	dedupe_key: string
	wire: string
	start_utc: number
}

/**
 * Rebuilds the `SourcedEvent`s the screens consume from stored occurrence
 * rows.
 *
 * `organization` is not read off the parsed wire event: the winning copy's
 * wire names only its own sponsors. `sponsors` -- built from
 * `organizationsQuery`, keyed by `dedupe_key` -- is the cross-source union
 * instead, and it wins over whatever the wire says. A key with nothing
 * sponsoring it leaves the field absent, never `[]`, matching `EventType`'s
 * own contract.
 *
 * `isOngoing` is likewise never trusted from the wire: every parser computes
 * it at parse time, so what is stored is as old as the fetch. It is recomputed
 * against `now`, which callers pass in rather than this module reading the
 * clock itself, so a test can pin it.
 *
 * Recomputed *here*, not continuously: it is fixed for as long as the caller's
 * result is, which for `read.ts`'s hooks means until the next write or the next
 * local day. `sections.ts` knows this and re-checks `endTime.isAfter(now)`
 * against its own minute ticker before placing a row under `Ongoing`.
 */
export function hydrate(
	rows: OccurrenceRowResult[],
	sponsors: Map<string, string[]>,
	now: Date,
): SourcedEvent[] {
	return rows.map((row) => {
		let wireEvent: WireEvent = JSON.parse(row.wire)
		let [converted] = convertEvents([wireEvent], {})

		let {organization: _wireOrganization, ...rest} = converted
		let union = sponsors.get(row.dedupe_key)

		// `union` can carry the same name twice -- when a duplicated event's
		// winner and a displaced copy both tag it, `organizationsQuery`'s
		// `group_concat` has no way to drop the repeat: SQLite rejects
		// `group_concat(distinct value, separator order by ...)` outright
		// ("DISTINCT aggregates must have exactly one argument"), and that
		// query's `order by` is load-bearing (see its own doc comment) and
		// separately tested, so `distinct` cannot go there. `[...new Set(...)]`
		// keeps the first occurrence and drops the rest instead: because
		// `union` already arrives winner-first, then a displaced copy's own
		// names, a sponsor both copies name ends up listed once, in the
		// winner's order, followed only by names a displaced copy contributes
		// that the winner didn't already name.
		let sponsorNames = union ? [...new Set(union)] : undefined

		let isOngoing =
			isBefore(rest.startTime.toDate(), startOfDay(now)) && isAfter(rest.endTime.toDate(), now)

		let event: EventType =
			sponsorNames && sponsorNames.length > 0
				? {...rest, isOngoing, organization: sponsorNames}
				: {...rest, isOngoing}

		return {sourceId: row.source_id, key: row.event_key, event}
	})
}
