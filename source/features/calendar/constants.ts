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
 * What the Calendar and its event timelines hide: games, which the Athletics
 * screen lists instead, and which made up about a third of the campus
 * calendar. The campus calendar files a game under the `Athletics` category;
 * Presence names `St. Olaf Athletics` as its sponsor.
 *
 * An event also filed under another category stays -- Homecoming is filed
 * under Alumni, Athletics, Music and Special Events. Presence gives events no
 * category, and its tags do not tell a game from anything else, so a Presence
 * event is judged by its sponsor alone: the odd non-game St. Olaf Athletics
 * sponsors, such as an opening event for a student cohort, is hidden with the
 * games.
 */
export const HIDDEN_FROM_CALENDAR: FilterSelection[] = [
	{axis: 'category', value: 'Athletics'},
	{axis: 'organization', value: 'St. Olaf Athletics'},
]
