import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'
import type {EventDetailTime} from '@frogpond/event-list/types'
import {formatDate, formatDateTime, formatTime, formatWeekday} from '@frogpond/time-format'

/**
 * The share sheet's one-line summary of when an event is. A same-day event
 * spells the date once; an event spanning days spells it at both ends.
 */
export function detailTimes(event: EventType, locale?: string): EventDetailTime {
	let start, end
	if (event.isOngoing) {
		start = formatDate(event.startTime, 'short', locale)
		end = formatDate(event.endTime, 'short', locale)
	} else if (event.isSameInstant) {
		start = `Starts on ${formatDateTime(event.startTime, locale)}`
		end = ''
	} else if (event.startTime.isSame(event.endTime, 'day')) {
		start = formatDateTime(event.startTime, locale)
		end = formatTime(event.endTime, locale)
		// A same-day end recorded at hour 0 is midnight, not `12 AM` -- the
		// bare time reads as the start of a day, not the end of one.
		if (event.endTime.hour() === 0 && event.endTime.minute() === 0) {
			end = 'Midnight'
		}
	} else {
		start = formatDateTime(event.startTime, locale)
		end = formatDateTime(event.endTime, locale)
	}

	return {start, end, allDay: event.isAllDay}
}

/**
 * One line of the event detail's date range, e.g. `From 7:45 AM Monday,
 * August 17, 2026`. There is no separate `meridiem` field: `Intl` folds the
 * meridiem into `time` itself, and in a 24-hour locale there is none to
 * split out.
 */
export interface EventTimeLine {
	prefix: string
	time: string
	date: string
}

/**
 * `Sunday – Aug 16`, matching Calendar.app's list section headers. The
 * weekday and the date are formatted separately because their relative
 * order is locale-specific (`Aug 16` in en-US, `16 Aug` in en-GB) while the
 * weekday always leads.
 */
export function formatSectionHeader(value: Moment, locale?: string): string {
	return `${formatWeekday(value, 'long', locale)} – ${formatDate(value, 'short', locale)}`
}

/**
 * The list row's trailing time column: a start and an end, locale-aware via
 * the same hour-cycle logic `detailTimeLines` uses, rather than duplicating
 * it. Unlike `detailTimeLines`, there is no prefix -- Calendar.app's list
 * puts the start above the end with no words between them -- and an all-day
 * event carries no text at all, since the row shows `all-day` in its place.
 */
export function listTimeLines(event: EventType, locale?: string): EventDetailTime {
	if (event.isAllDay) {
		return {start: '', end: '', allDay: true}
	}

	let start, end
	if (event.isOngoing) {
		start = formatDate(event.startTime, 'short', locale)
		end = formatDate(event.endTime, 'short', locale)
	} else if (event.isMultiDay) {
		start = formatTime(event.startTime, locale)
		// A multi-day event's end needs both a date and a time -- the date alone
		// drops when it ends.
		end = `${formatDate(event.endTime, 'short', locale)}, ${formatTime(event.endTime, locale)}`
	} else if (event.isSameInstant) {
		start = formatTime(event.startTime, locale)
		end = ''
	} else {
		start = formatTime(event.startTime, locale)
		end = formatTime(event.endTime, locale)
	}

	return {start, end, allDay: false}
}

/**
 * The last day an all-day event covers.
 *
 * The two sources disagree about where an all-day event ends: the web
 * calendars end it exclusively, at midnight the following day, while EventKit
 * ends it inclusively, at 23:59:59 the same day. The last day it actually
 * covers is the instant before its end under either convention.
 */
export function allDayLastDay(event: EventType): Moment {
	return event.endTime.isAfter(event.startTime)
		? event.endTime.clone().subtract(1, 'millisecond')
		: event.startTime
}

/**
 * `locale` defaults to the device locale via `@frogpond/time-format`'s
 * `deviceLocale()`, which composes the OS's 24-hour preference onto the
 * language tag -- bare `undefined` does not carry that preference.
 */
export function detailTimeLines(event: EventType, locale?: string): EventTimeLine[] {
	let startDate = formatDate(event.startTime, 'long', locale)
	let endDate = formatDate(event.endTime, 'long', locale)

	if (event.isAllDay) {
		let lastDay = allDayLastDay(event)

		if (lastDay.isSame(event.startTime, 'day')) {
			return [{prefix: 'All day', time: '', date: startDate}]
		}

		return [
			{prefix: 'All day from', time: '', date: startDate},
			{prefix: 'to', time: '', date: formatDate(lastDay, 'long', locale)},
		]
	}

	if (event.isSameInstant) {
		return [{prefix: '', time: formatTime(event.startTime, locale), date: startDate}]
	}

	if (event.isOngoing) {
		return [
			{prefix: 'From', time: '', date: startDate},
			{prefix: 'to', time: '', date: endDate},
		]
	}

	return [
		{prefix: 'From', time: formatTime(event.startTime, locale), date: startDate},
		{prefix: 'to', time: formatTime(event.endTime, locale), date: endDate},
	]
}
