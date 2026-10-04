import type {CalendarFilter, CalendarMode} from './store'

/** The Presence calendar source's id: the only source naming an event's organization. */
export const PRESENCE_SOURCE = 'presence'

/**
 * How the calendar screen draws itself: from the reader's saved settings, or,
 * when it was opened for one organization, narrowed to that organization's
 * events in the Upcoming list -- for this screen only, never saved, so the
 * reader's own calendar is as they left it.
 */
export type CalendarView = {
	filter: CalendarFilter | null
	mode: CalendarMode
	/** Whether the reader may switch Day/Upcoming and pick filters. */
	adjustable: boolean
}

export function calendarView(
	saved: {filter: CalendarFilter | null; mode: CalendarMode},
	organization: string | undefined,
): CalendarView {
	if (organization === undefined) {
		return {...saved, adjustable: true}
	}
	return {filter: {axis: 'organization', value: organization}, mode: 'upcoming', adjustable: false}
}

/**
 * Whether opening the calendar for an organization should turn the Presence
 * source on: the reader asked for that organization's events, and only
 * Presence has any.
 */
export function needsPresence(organization: string | undefined, enabledIds: string[]): boolean {
	return organization !== undefined && !enabledIds.includes(PRESENCE_SOURCE)
}
