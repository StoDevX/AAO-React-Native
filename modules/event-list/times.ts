import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'
import type {EventDetailTime} from '@frogpond/event-list/types'

export function times(event: EventType): EventDetailTime {
	let eventLength = moment
		.duration(event.endTime.diff(event.startTime))
		.asHours()

	let allDay = eventLength === 24
	let multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
	let sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')

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
		let endFormat =
			endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
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
	let eventLength = moment
		.duration(event.endTime.diff(event.startTime))
		.asHours()

	let allDay = eventLength === 24
	let multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
	let sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')
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
		let multiDayEndFormat =
			endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
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
