import {differenceInCalendarDays, isValid, parseISO} from 'date-fns'

/// How long ago a posting went up, as the Student Work list sections it.
export type Recency = 'This Week' | 'Last Week' | 'Earlier'

export const RECENCY_ORDER: Recency[] = ['This Week', 'Last Week', 'Earlier']

const DAYS_IN_A_WEEK = 7

/// Which section a posting belongs in, counting whole days back from `today`.
///
/// A posting dated after today -- a device clock set wrong, or a posting
/// published in another zone -- still counts as this week's, and one with no
/// readable date as the oldest.
export function recencyOf(postedDate: string, today: Date): Recency {
	let posted = parseISO(postedDate)
	if (!isValid(posted)) return 'Earlier'

	let daysAgo = differenceInCalendarDays(today, posted)
	if (daysAgo < DAYS_IN_A_WEEK) return 'This Week'
	if (daysAgo < DAYS_IN_A_WEEK * 2) return 'Last Week'
	return 'Earlier'
}
