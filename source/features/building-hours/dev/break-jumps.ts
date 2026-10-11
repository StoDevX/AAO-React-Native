import moment, {type Moment} from 'moment-timezone'
import type {BreakCalendarResponse} from '@frogpond/schedules'

/** A break in the campus calendar, as somewhere the dev sheet's clock can go. */
export type BreakJump = {
	key: string
	label: string
	/** The break's dates, e.g. "Oct 10 – 13". */
	shows: string
	/** Noon on the break's first day, in the calendar's timezone. */
	moment: () => Moment
	/** Whether `m` falls on one of the break's days. */
	includes: (m: Moment) => boolean
}

function describeDates(start: Moment, end: Moment): string {
	if (start.isSame(end, 'day')) return start.format('MMM D')
	if (start.isSame(end, 'month')) return `${start.format('MMM D')} – ${end.format('D')}`
	return `${start.format('MMM D')} – ${end.format('MMM D')}`
}

/**
 * Each break in `calendar`, soonest first. Jumping to one moves the clock
 * into it, and the server then answers with that break's hours, the same as
 * it will on the day.
 */
export function breakJumps(calendar: BreakCalendarResponse): BreakJump[] {
	let {timezone, breaks} = calendar.data
	let day = (date: string) => moment.tz(date, 'YYYY-MM-DD', true, timezone)
	return Object.entries(breaks)
		.flatMap(([key, entry]) => {
			const first = entry.date ?? entry.start
			const last = entry.date ?? entry.end
			if (first === undefined || last === undefined) return []
			let start = day(first)
			let end = day(last)
			if (!start.isValid() || !end.isValid()) return []
			return [
				{
					key,
					label: entry.name,
					shows: describeDates(start, end),
					moment: () => start.clone().hour(12),
					includes: (m: Moment) => {
						let date = m.clone().tz(timezone).format('YYYY-MM-DD')
						return first <= date && date <= last
					},
					first,
				},
			]
		})
		.sort((a, b) => a.first.localeCompare(b.first))
		.map(({first: _first, ...jump}) => jump)
}
