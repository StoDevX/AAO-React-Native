import type {FilterSelection} from '../../database/calendar/queries.ts'

export const STOLAF_POWERED_BY = {
	title: 'Powered by the St. Olaf calendar',
	href: 'https://wp.stolaf.edu/calendar/',
}

export const PRESENCE_POWERED_BY = {
	title: 'Powered by Presence',
	href: 'https://stolaf.presence.io/events',
}

/**
 * Events carrying any of these never appear in the Calendar, and the filter
 * menu never offers them. Athletics made up about a third of the campus
 * calendar, and the Athletics screen already lists the coming games. The
 * campus calendar files a game under the `Athletics` category; Presence names
 * `St. Olaf Athletics` as its sponsor.
 */
export const HIDDEN_FROM_CALENDAR: FilterSelection[] = [
	{axis: 'category', value: 'Athletics'},
	{axis: 'organization', value: 'St. Olaf Athletics'},
]
