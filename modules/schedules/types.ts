/** A date in YYYY-MM-DD form, interpreted in the calendar's timezone. */
export type CalendarDate = string

/** One full calendar day or a range including both named days. */
export type CalendarInterval =
	| {date: CalendarDate; start?: never; end?: never}
	| {date?: never; start: CalendarDate; end: CalendarDate}

/** The public name and dates of a break, without operating policies. */
export type CalendarBreak = CalendarInterval & {name: string}

/** Break keys remain independent of the schedule payload and campus. */
export type BreakCalendar = {
	timezone: string
	breaks: Record<string, CalendarBreak>
}

/** The abbreviated calendar endpoint excludes defaults and templates. */
export type BreakCalendarResponse = {data: BreakCalendar}

/** Replaces all services for one local opening date. */
export type ScheduleException<T> = {date: CalendarDate; schedule: T[]}

/** Canonical resolved policy; exceptions are always present. */
export type SchedulePolicy<T> = {
	schedule: T[]
	exceptions: ScheduleException<T>[]
}

/** Array shorthand and omitted exceptions are permitted in authored policies. */
export type AuthoredSchedulePolicy<T> = T[] | {schedule: T[]; exceptions?: ScheduleException<T>[]}

/** A space can name normal, inherit, a template, or another authored break entry. */
export type AuthoredBreakEntry<T> = string | AuthoredSchedulePolicy<T>

/** Defaults can name templates; templates contain complete policies, not references. */
export type AuthoredCalendarBreak<T> = CalendarBreak & {
	defaultSpaceSchedule?: string | AuthoredSchedulePolicy<T>
	templates?: Record<string, AuthoredSchedulePolicy<T>>
}

/** Authored definitions retain operating policies outside the public calendar contract. */
export type AuthoredBreakCalendar<T> = {
	timezone: string
	breaks: Record<string, AuthoredCalendarBreak<T>>
	templates?: Record<string, AuthoredSchedulePolicy<T>>
}

/** Normal recurring services and independent opening-date replacements. */
export type NormalSchedule<T> = {
	schedule: T[]
	exceptions?: ScheduleException<T>[]
}

/** Missing authored keys are policy gaps; references require upstream resolution. */
export type AuthoredSchedules<T> = NormalSchedule<T> & {
	breakSchedule?: Partial<Record<string, AuthoredBreakEntry<T>>>
}

/** Resolved responses preserve every authored key and leave missing keys absent. */
export type ResolvedSchedules<T> = NormalSchedule<T> & {
	breakSchedule?: Partial<Record<string, SchedulePolicy<T>>>
}

/** Half-open epoch boundaries with a DST-independent inclusive calendar-day span. */
export type NormalizedInterval = {
	startMs: number
	endMs: number
	calendarDays: number
}
