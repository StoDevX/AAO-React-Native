import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'
import type {EventDetailTime} from '@frogpond/event-list/types'

/// Shared by `times`, `detailTimes`, and `detailTimeLines` so the three agree
/// on what counts as all-day, multi-day, or a same-instant event.
function classify(event: EventType): {
	allDay: boolean
	multiDay: boolean
	sillyZeroLength: boolean
} {
	let eventLength = moment.duration(event.endTime.diff(event.startTime)).asHours()

	return {
		allDay: eventLength === 24,
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

/// `6 PM`, not `6:00 PM` -- Calendar.app drops `:00` on the hour. In a
/// 24-hour locale this naturally becomes `18` with no meridiem, which is
/// correct for that locale.
function formatDetailTime(value: Moment, locale: string | undefined): string {
	let options: Intl.DateTimeFormatOptions =
		value.minutes() === 0 ? {hour: 'numeric'} : {hour: 'numeric', minute: '2-digit'}
	return new Intl.DateTimeFormat(locale, options).format(value.toDate())
}

/// `locale` defaults to the device's own locale -- `undefined` tells `Intl`
/// to use the system default rather than hardcoding one.
export function detailTimeLines(event: EventType, locale?: string): EventTimeLine[] {
	let {allDay, sillyZeroLength} = classify(event)
	let startDate = formatDetailDate(event.startTime, locale)
	let endDate = formatDetailDate(event.endTime, locale)

	if (allDay) {
		return [{prefix: 'All day', time: '', date: startDate}]
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
