import {DAYS_OF_WEEK} from '../components/days'
import type {DayOfWeek} from '../types'

const DAY_LABELS = Object.fromEntries(DAYS_OF_WEEK.map(({day, label}) => [day, label])) as Record<
	DayOfWeek,
	string
>

/**
 * The timetable Section's title: which day is on screen, and what the line is
 * doing. The line's own name is deliberately absent -- the sheet's navigation
 * title already says it, and so does the screen above.
 *
 * The day leads because the picker sits in the navigation bar, leaving
 * this the only place in the content area that says which day you are reading.
 *
 * With no timetable the title is the day alone: the empty state below it
 * already says the line is not running, and the status would only repeat it.
 */
export function scheduleSectionTitle({
	selectedDay,
	subtitle,
	hasTimetable,
}: {
	selectedDay: DayOfWeek | null
	subtitle: string
	hasTimetable: boolean
}): string {
	let day = selectedDay ? DAY_LABELS[selectedDay] : 'Today'
	let title = subtitle && hasTimetable ? `${day} — ${subtitle}` : day
	return title.toUpperCase()
}
