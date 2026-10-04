/** A date in YYYY-MM-DD form, interpreted in the calendar's timezone. */
export type CalendarDate = string

/** One full calendar day or a range including both named days. */
export type CalendarInterval =
	| {date: CalendarDate; start?: never; end?: never}
	| {date?: never; start: CalendarDate; end: CalendarDate}

/** The name and dates of a break, with optional operating schedules. */
export type CalendarBreak<T = never> = CalendarInterval & {
	name: string
	defaultSpaceSchedule?: string | Schedule<T>
	templates?: Record<string, Schedule<T>>
}

/** Break keys remain independent of the schedule payload and campus. */
export type BreakCalendar<T = never> = {
	timezone: string
	breaks: Record<string, CalendarBreak<T>>
	templates?: Record<string, Schedule<T>>
}

/** The abbreviated calendar endpoint excludes defaults and templates. */
export type BreakCalendarResponse = {
	data: {
		timezone: string
		breaks: Record<string, CalendarInterval & Pick<CalendarBreak, 'name'>>
	}
}

/** Replaces all services for one local opening date. */
export type ScheduleException<T> = {date: CalendarDate; schedule: T[]}

/** Recurring services and their opening-date replacements. */
export type Schedule<T> = {
	schedule: T[]
	exceptions: ScheduleException<T>[]
}

/** Break entries may contain schedules or references awaiting resolution. */
export type Schedules<T, TBreakSchedule = Schedule<T>> = {
	schedule: T[]
	exceptions?: ScheduleException<T>[]
	breakSchedule?: Partial<Record<string, TBreakSchedule>>
}

/** Half-open epoch boundaries with a DST-independent inclusive calendar-day span. */
export type NormalizedInterval = {
	startMs: number
	endMs: number
	calendarDays: number
}
