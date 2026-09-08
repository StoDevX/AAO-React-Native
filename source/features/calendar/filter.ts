import type {SourcedEvent} from '@frogpond/event-list/types'

import type {CalendarFilter} from './store'

/**
 * Every category at least one event carries, sorted Z-A. SwiftUI's Menu
 * renders a section bottom-to-top, so Z-A here reads A-Z on screen.
 */
export function availableCategories(events: SourcedEvent[]): string[] {
	let categories = new Set(events.flatMap((e) => e.event.categories ?? []))
	return [...categories].sort((a, b) => b.localeCompare(a))
}

/**
 * Every organisation sponsoring at least one event, sorted Z-A. SwiftUI's
 * Menu renders a section bottom-to-top, so Z-A here reads A-Z on screen.
 */
export function availableOrganizations(events: SourcedEvent[]): string[] {
	let organizations = new Set(events.flatMap((e) => e.event.organization ?? []))
	return [...organizations].sort((a, b) => b.localeCompare(a))
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
