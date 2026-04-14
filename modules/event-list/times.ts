import {diffInHours, dayOfYear, isSame, format} from '../../source/lib/temporal'
import type {EventType} from '@frogpond/event-type'
import type {EventDetailTime} from '@frogpond/event-list/types'

export function times(event: EventType): EventDetailTime {
	let eventLength = diffInHours(event.endTime, event.startTime)

	let allDay = eventLength === 24
	let multiDay = dayOfYear(event.startTime) !== dayOfYear(event.endTime)
	let sillyZeroLength = isSame(event.startTime, event.endTime, 'minute')

	let startTimeFormatted = format(event.startTime, 'h:mm A')
	let endTimeFormatted = format(event.endTime, 'h:mm A')
	let midnightTime = '12:00 AM'

	let start, end
	if (event.isOngoing) {
		start = format(event.startTime, 'MMM. D')
		end = format(event.endTime, 'MMM. D')
	} else if (multiDay) {
		// 12:00 PM to Jun. 25 3:00pm
		// Midnight to Jun. 25 <-- assuming the end time is also midnight
		start = startTimeFormatted
		let endFormat =
			endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
		end = `to ${format(event.endTime, endFormat)}`
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
	let eventLength = diffInHours(event.endTime, event.startTime)

	let allDay = eventLength === 24
	let multiDay = dayOfYear(event.startTime) !== dayOfYear(event.endTime)
	let sillyZeroLength = isSame(event.startTime, event.endTime, 'minute')
	let endsOnSameDay = isSame(event.startTime, event.endTime, 'day')

	let endFmt = endsOnSameDay ? 'h:mm A' : 'MMM. D h:mm A'
	let startTimeFormatted = format(event.startTime, 'MMM. D h:mm A')
	let endTimeFormatted = format(event.endTime, endFmt)
	let midnightTime = '12:00 AM'

	let start, end
	if (event.isOngoing) {
		start = format(event.startTime, 'MMM. D')
		end = format(event.endTime, 'MMM. D')
	} else if (multiDay) {
		start = startTimeFormatted
		let multiDayEndFormat =
			endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
		end = `${format(event.endTime, multiDayEndFormat)}`
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
