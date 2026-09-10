import type {SourcedEvent} from '@frogpond/event-list/types'

import type {CalendarFilter} from './store'

/** A value the calendar can be narrowed to, and how many events carry it. */
export type CalendarFilterOption = {
	value: string
	count: number
}

/**
 * Every value at least one event carries, tallied, sorted Z-A by value.
 * SwiftUI's Menu renders its contents bottom-to-top, so Z-A here reads A-Z on
 * screen.
 *
 * A value is counted once per event, however many times that event lists it:
 * the tally answers "how many events would this leave me", so it has to agree
 * with what `filterEvents` returns.
 */
function tally(
	events: SourcedEvent[],
	valuesOf: (entry: SourcedEvent) => readonly string[],
): CalendarFilterOption[] {
	let counts = new Map<string, number>()

	for (let entry of events) {
		for (let value of new Set(valuesOf(entry))) {
			counts.set(value, (counts.get(value) ?? 0) + 1)
		}
	}

	return [...counts]
		.map(([value, count]) => ({value, count}))
		.sort((a, b) => b.value.localeCompare(a.value))
}

/** Every category at least one event carries, with its tally. */
export function availableCategories(events: SourcedEvent[]): CalendarFilterOption[] {
	return tally(events, (entry) => entry.event.categories ?? [])
}

/** Every organisation sponsoring at least one event, with its tally. */
export function availableOrganizations(events: SourcedEvent[]): CalendarFilterOption[] {
	return tally(events, (entry) => entry.event.organization ?? [])
}

/**
 * Narrows events to whichever single axis is selected, or returns every
 * event when nothing is.
 */
export function filterEvents(
	events: SourcedEvent[],
	filter: CalendarFilter | null,
): SourcedEvent[] {
	if (filter === null) return events
	if (filter.axis === 'organization') {
		return events.filter((e) => e.event.organization?.includes(filter.value) ?? false)
	}
	return events.filter((e) => e.event.categories?.includes(filter.value))
}
