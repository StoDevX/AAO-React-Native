import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'
import type {EventDetailTime} from '@frogpond/event-list/types'

/// Shared by `times`, `detailTimes`, and `detailTimeLines` so the three agree
/// on what counts as all-day, multi-day, or a same-instant event.
///
/// All-day is the source's own statement rather than a duration.
/// `config.startTime` and `config.endTime` say which of an event's edges carry
/// a meaningful time, and every parser sets them from the upstream flag --
/// `parsers/tec-events.ts` from `all_day`, `ccc-calendar/device-calendar.ts`
/// from EventKit's `allDay`. Both edges meaningless is what all-day means.
///
/// A duration test cannot serve both sources: EventKit spans an all-day event
/// 00:00:00 to 23:59:59, which is 23.9997 hours rather than a round 24, and a
/// web event that genuinely runs a full 24 hours is not all-day at all.
function classify(event: EventType): {
	allDay: boolean
	multiDay: boolean
	sillyZeroLength: boolean
} {
	return {
		allDay: !event.config.startTime && !event.config.endTime,
		multiDay: event.startTime.dayOfYear() !== event.endTime.dayOfYear(),
		sillyZeroLength: event.startTime.isSame(event.endTime, 'minute'),
	}
}

export function times(event: EventType): EventDetailTime {
	let {allDay, multiDay, sillyZeroLength} = classify(event)

	let startTimeFormatted = event.startTime.format('h:mm A')
	let endTimeFormatted = event.endTime.format('h:mm A')
	let midnightTime = '12:00 AM'

	let start, end
	if (event.isOngoing) {
		start = event.startTime.format('MMM. D')
		end = event.endTime.format('MMM. D')
	} else if (multiDay) {
		// 12:00 PM to Jun. 25 3:00pm
		// Midnight to Jun. 25 <-- assuming the end time is also midnight
		start = startTimeFormatted
		let endFormat = endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
		end = `to ${event.endTime.format(endFormat)}`
	} else if (sillyZeroLength) {
		start = startTimeFormatted
		end = 'until ???'
	} else {
		start = startTimeFormatted
		end = endTimeFormatted
	}

	start = start === midnightTime ? 'Midnight' : start
	end = end === midnightTime ? 'Midnight' : end

	return {start, end, allDay}
}

export function detailTimes(event: EventType): EventDetailTime {
	let {allDay, multiDay, sillyZeroLength} = classify(event)
	let endsOnSameDay = event.startTime.isSame(event.endTime, 'day')

	let endFormat = endsOnSameDay ? 'h:mm A' : 'MMM. D h:mm A'
	let startTimeFormatted = event.startTime.format('MMM. D h:mm A')
	let endTimeFormatted = event.endTime.format(endFormat)
	let midnightTime = '12:00 AM'

	let start, end
	if (event.isOngoing) {
		start = event.startTime.format('MMM. D')
		end = event.endTime.format('MMM. D')
	} else if (multiDay) {
		// 12:00 PM to Jun. 25 3:00pm
		// Midnight to Jun. 25 <-- assuming the end time is also midnight
		start = startTimeFormatted
		let multiDayEndFormat = endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
		end = `${event.endTime.format(multiDayEndFormat)}`
	} else if (sillyZeroLength) {
		start = `Starts on ${startTimeFormatted}`
		end = ''
	} else {
		start = startTimeFormatted
		end = endTimeFormatted
	}

	start = start === midnightTime ? 'Midnight' : start
	end = end === midnightTime ? 'Midnight' : end

	return {start, end, allDay}
}

/// One line of the event detail's date range, e.g. `From 7:45 AM Monday,
/// August 17, 2026`. There is no separate `meridiem` field: `Intl` folds the
/// meridiem into `time` itself, and in a 24-hour locale there is none to
/// split out.
export interface EventTimeLine {
	prefix: string
	time: string
	date: string
}

const DETAIL_LINE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	weekday: 'long',
	month: 'long',
	day: 'numeric',
	year: 'numeric',
}

function formatDetailDate(value: Moment, locale: string | undefined): string {
	return new Intl.DateTimeFormat(locale, DETAIL_LINE_DATE_OPTIONS).format(value.toDate())
}

/// Whether the locale writes a meridiem, which is also what makes an
/// hour-only time readable: `6 PM` stands on its own, `18` does not.
function hasMeridiem(locale: string | undefined): boolean {
	return new Intl.DateTimeFormat(locale, {hour: 'numeric'})
		.formatToParts(new Date(0))
		.some((part) => part.type === 'dayPeriod')
}

/// `6 PM`, not `6:00 PM` -- Calendar.app drops `:00` on the hour.
///
/// Only where there is a meridiem, though. Dropping the minutes in a 24-hour
/// locale leaves a bare `15`, and `From 15 Wednesday, 19 August` does not read
/// as a time at all; those locales keep `15:00`.
function formatDetailTime(value: Moment, locale: string | undefined): string {
	let meridiem = hasMeridiem(locale)

	// A 24-hour clock pads the hour -- `06:00`, not `6:00` -- while a 12-hour
	// one does not: `06 AM` is wrong wherever `6 AM` is right.
	let hour = meridiem ? ('numeric' as const) : ('2-digit' as const)
	let options: Intl.DateTimeFormatOptions =
		value.minutes() === 0 && meridiem ? {hour} : {hour, minute: '2-digit'}

	return new Intl.DateTimeFormat(locale, options).format(value.toDate())
}

const LIST_SECTION_DATE_OPTIONS: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'}

/// A section header's date, e.g. `Aug 20` -- short, unlike the detail
/// screen's `August 20, 2026`, since this sits next to a weekday on one line.
function formatListDate(value: Moment, locale: string | undefined): string {
	return new Intl.DateTimeFormat(locale, LIST_SECTION_DATE_OPTIONS).format(value.toDate())
}

/// `Sunday – Aug 16`, matching Calendar.app's list section headers. The
/// weekday and the date are formatted separately because their relative
/// order is locale-specific (`Aug 16` in en-US, `16 Aug` in en-GB) while the
/// weekday always leads.
export function formatSectionHeader(value: Moment, locale?: string): string {
	let weekday = new Intl.DateTimeFormat(locale, {weekday: 'long'}).format(value.toDate())
	return `${weekday} – ${formatListDate(value, locale)}`
}

/// The list row's trailing time column: a start and an end, locale-aware via
/// the same hour-cycle logic `detailTimeLines` uses, rather than duplicating
/// it. Unlike `detailTimeLines`, there is no prefix -- Calendar.app's list
/// puts the start above the end with no words between them -- and an all-day
/// event carries no text at all, since the row shows `all-day` in its place.
export function listTimeLines(event: EventType, locale?: string): EventDetailTime {
	let {allDay, multiDay, sillyZeroLength} = classify(event)

	if (allDay) {
		return {start: '', end: '', allDay: true}
	}

	let start, end
	if (event.isOngoing) {
		start = formatListDate(event.startTime, locale)
		end = formatListDate(event.endTime, locale)
	} else if (multiDay) {
		start = formatDetailTime(event.startTime, locale)
		// A multi-day event's end needs both a date and a time -- the date
		// alone drops when it ends, and the old list showed both.
		end = `${formatListDate(event.endTime, locale)}, ${formatDetailTime(event.endTime, locale)}`
	} else if (sillyZeroLength) {
		start = formatDetailTime(event.startTime, locale)
		end = ''
	} else {
		start = formatDetailTime(event.startTime, locale)
		end = formatDetailTime(event.endTime, locale)
	}

	return {start, end, allDay: false}
}

/// `locale` defaults to the device's own locale -- `undefined` tells `Intl`
/// to use the system default rather than hardcoding one.
export function detailTimeLines(event: EventType, locale?: string): EventTimeLine[] {
	let {allDay, sillyZeroLength} = classify(event)
	let startDate = formatDetailDate(event.startTime, locale)
	let endDate = formatDetailDate(event.endTime, locale)

	if (allDay) {
		// The two sources disagree about where an all-day event ends: the web
		// calendars end it exclusively, at midnight the following day, while
		// EventKit ends it inclusively, at 23:59:59 the same day. The last day it
		// actually covers is the instant before its end under either convention.
		let lastDay = event.endTime.isAfter(event.startTime)
			? event.endTime.clone().subtract(1, 'millisecond')
			: event.startTime

		if (lastDay.isSame(event.startTime, 'day')) {
			return [{prefix: 'All day', time: '', date: startDate}]
		}

		return [
			{prefix: 'All day from', time: '', date: startDate},
			{prefix: 'to', time: '', date: formatDetailDate(lastDay, locale)},
		]
	}

	if (sillyZeroLength) {
		return [{prefix: '', time: formatDetailTime(event.startTime, locale), date: startDate}]
	}

	if (event.isOngoing) {
		return [
			{prefix: 'From', time: '', date: startDate},
			{prefix: 'to', time: '', date: endDate},
		]
	}

	return [
		{prefix: 'From', time: formatDetailTime(event.startTime, locale), date: startDate},
		{prefix: 'to', time: formatDetailTime(event.endTime, locale), date: endDate},
	]
}
