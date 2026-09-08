import {useQueries} from '@tanstack/react-query'

import {dedupeKey} from '@frogpond/event-list/calendar-util'
import {deviceCalendarOptions, namedCalendarOptions} from './query'
import {
	type CalendarSource,
	deviceCalendarIdFrom,
	isDeviceSourceId,
	type SourcedEvent,
} from './sources'

type MergedEvents = {
	events: SourcedEvent[]
	failed: CalendarSource[]
	isLoading: boolean
	isRefetching: boolean
	refetchAll: () => Promise<void>
}

/**
 * One row per event, where more than one calendar carries it. The first
 * occurrence wins, and `useMergedEvents` concatenates in `sources` order, so
 * the winner is whichever source `REMOTE_SOURCES` lists first -- the campus
 * calendar over Presence. The survivor keeps its own `sourceId`, so the row's
 * tint and the detail route it opens stay the source the user is looking at.
 *
 * The one thing a survivor takes from the copy it displaced is a sponsoring
 * organisation it has none of its own. Only Presence names one, so a game both
 * calendars carry would otherwise drop out of the organisation filter -- the
 * copy that knew the sponsor is the one that loses. A survivor that already
 * names an organisation keeps its own.
 */
export function dedupeEvents(events: SourcedEvent[]): SourcedEvent[] {
	let survivors = new Map<string, SourcedEvent>()

	for (let entry of events) {
		let key = dedupeKey(entry.event)
		let survivor = survivors.get(key)

		if (!survivor) {
			survivors.set(key, entry)
			continue
		}

		if (!survivor.event.organization && entry.event.organization) {
			// Re-setting an existing key leaves it where it was, so the merged
			// list stays in the order it was given.
			survivors.set(key, {
				...survivor,
				event: {...survivor.event, organization: entry.event.organization},
			})
		}
	}

	return [...survivors.values()]
}

export function useMergedEvents(sources: CalendarSource[]): MergedEvents {
	let results = useQueries({
		queries: sources.map((source) =>
			isDeviceSourceId(source.id)
				? deviceCalendarOptions(deviceCalendarIdFrom(source.id))
				: namedCalendarOptions(source.id),
		),
	})

	// `useQueries` hands back a fresh array every render, so there is nothing
	// stable to memoize these against -- deriving them plainly is both what
	// the lint rule (@tanstack/query/no-unstable-deps) wants and the simpler
	// code.
	//
	// No branching: each query tagged its own results in `select`, so a device
	// result and a remote one already have the same shape by the time they get
	// here. `sources` is needed below only to name what failed.
	let events = dedupeEvents(results.flatMap((result) => result.data ?? []))
	let failed = sources.filter((_, index) => results[index]?.isError)
	let isLoading = results.some((result) => result.isLoading)
	let isRefetching = results.some((result) => result.isRefetching)

	let refetchAll = async () => {
		await Promise.all(results.map((result) => result.refetch()))
	}

	return {events, failed, isLoading, isRefetching, refetchAll}
}
