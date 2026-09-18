import type {DayOfWeek} from '../types'

const DAY_NAMES: Record<DayOfWeek, string> = {
	Su: 'Sunday',
	Mo: 'Monday',
	Tu: 'Tuesday',
	We: 'Wednesday',
	Th: 'Thursday',
	Fr: 'Friday',
	Sa: 'Saturday',
}

/**
 * The timetable Section's title: which day is on screen, and what the line is
 * doing. The line's own name is deliberately absent -- the tab bar already
 * says it, and so does the screen above.
 *
 * The day leads because the picker now sits in the navigation bar, leaving
 * this the only place in the content area that says which day you are reading.
 */
export function scheduleSectionTitle({
	selectedDay,
	subtitle,
}: {
	selectedDay: DayOfWeek | null
	subtitle: string
}): string {
	let day = selectedDay ? DAY_NAMES[selectedDay] : 'Today'
	let title = subtitle ? `${day} — ${subtitle}` : day
	return title.toUpperCase()
}
