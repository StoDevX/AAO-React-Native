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
/// August 17, 2026`. `time`/`meridiem` are split out so a component can
/// render the meridiem in a smaller nested `Text`, matching Calendar.app's
/// small-caps AM/PM.
export interface EventTimeLine {
	prefix: string
	time: string
	meridiem: string
	date: string
}

const DETAIL_LINE_DATE_FORMAT = 'dddd, MMMM D, YYYY'

/// `6 PM`, not `6:00 PM` -- Calendar.app drops `:00` on the hour.
function timeLineParts(value: Moment): {time: string; meridiem: string} {
	return {
		time: value.minutes() === 0 ? value.format('h') : value.format('h:mm'),
		meridiem: value.format('A'),
	}
}

export function detailTimeLines(event: EventType): EventTimeLine[] {
	let {allDay, sillyZeroLength} = classify(event)
	let startDate = event.startTime.format(DETAIL_LINE_DATE_FORMAT)
	let endDate = event.endTime.format(DETAIL_LINE_DATE_FORMAT)

	if (allDay) {
		return [{prefix: 'All day', time: '', meridiem: '', date: startDate}]
	}

	if (sillyZeroLength) {
		let {time, meridiem} = timeLineParts(event.startTime)
		return [{prefix: '', time, meridiem, date: startDate}]
	}

	if (event.isOngoing) {
		return [
			{prefix: 'From', time: '', meridiem: '', date: startDate},
			{prefix: 'to', time: '', meridiem: '', date: endDate},
		]
	}

	let start = timeLineParts(event.startTime)
	let end = timeLineParts(event.endTime)

	return [
		{prefix: 'From', time: start.time, meridiem: start.meridiem, date: startDate},
		{prefix: 'to', time: end.time, meridiem: end.meridiem, date: endDate},
	]
}
