import type {FilterSelection} from '../../database/calendar/queries.ts'
import {HIDDEN_FROM_CALENDAR} from './constants'
import type {CalendarFilter, CalendarMode} from './store'

/** The Presence calendar source's id: the only source naming an event's organization. */
export const PRESENCE_SOURCE = 'presence'

/**
 * How the calendar screen draws itself: from the reader's saved settings, or,
 * when it was opened for one organization, that organization's Presence
 * events in the Upcoming list. An organization's view chooses everything for
 * itself and saves nothing, so the reader's own calendar -- its filter, its
 * mode and which calendars are on -- is as they left it.
 */
export type CalendarView = {
	filter: CalendarFilter | null
	mode: CalendarMode
	/** Whether the reader may switch Day/Upcoming, pick filters and calendars. */
	adjustable: boolean
	/** The calendars to read, or `null` for the ones the reader turned on. */
	sourceIds: string[] | null
	/** Events left out however the list is filtered. */
	exclude: FilterSelection[]
}

export function calendarView(
	saved: {filter: CalendarFilter | null; mode: CalendarMode},
	organization: string | undefined,
): CalendarView {
	if (organization === undefined) {
		return {...saved, adjustable: true, sourceIds: null, exclude: HIDDEN_FROM_CALENDAR}
	}
	return {
		filter: {axis: 'organization', value: organization},
		mode: 'upcoming',
		adjustable: false,
		// Only Presence names an event's organization, so only its events can match.
		sourceIds: [PRESENCE_SOURCE],
		// The calendar hides St. Olaf Athletics' games, which Athletics shows
		// instead -- but someone who opened that organization asked for them.
		exclude: [],
	}
}
