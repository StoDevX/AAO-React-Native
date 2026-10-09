import {useCalendarSources} from '@frogpond/ccc-calendar'

import {useCampusSection} from '../campus/store'

/** Stable, so a campus without a calendar does not hand the hook a new list each render. */
const NO_SOURCES: readonly string[] = []

/**
 * The calendars the active campus's calendar screen offers, with the reader's
 * on and off. A campus without a calendar section offers none.
 */
export function useCampusCalendarSources(): ReturnType<typeof useCalendarSources> {
	let calendar = useCampusSection('calendar')
	return useCalendarSources(calendar?.sources ?? NO_SOURCES)
}
