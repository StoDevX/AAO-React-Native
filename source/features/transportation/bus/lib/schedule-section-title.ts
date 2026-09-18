import {DAYS_OF_WEEK} from '../components/days'
import type {DayOfWeek} from '../types'

const DAY_LABELS = Object.fromEntries(DAYS_OF_WEEK.map(({day, label}) => [day, label])) as Record<
	DayOfWeek,
	string
>

/**
 * The timetable Section's title: which day is on screen, and what the line is
 * doing. The line's own name is deliberately absent -- the tab bar already
 * says it, and so does the screen above.
 *
 * The day leads because the picker sits in the navigation bar, leaving
 * this the only place in the content area that says which day you are reading.
 */
export function scheduleSectionTitle({
	selectedDay,
	subtitle,
}: {
	selectedDay: DayOfWeek | null
	subtitle: string
}): string {
	let day = selectedDay ? DAY_LABELS[selectedDay] : 'Today'
	let title = subtitle ? `${day} — ${subtitle}` : day
	return title.toUpperCase()
}
