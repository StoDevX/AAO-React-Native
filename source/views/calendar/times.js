// @flow

import moment from 'moment-timezone'
import type {EventType} from './types'

export function times(event: EventType) {
  const eventLength = moment
    .duration(event.endTime.diff(event.startTime))
    .asHours()

  const allDay = eventLength === 24
  const multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
  const sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')

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
    const endFormat =
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

export function detailTimes(event: EventType) {
  const eventLength = moment
    .duration(event.endTime.diff(event.startTime))
    .asHours()

  const allDay = eventLength === 24
  const multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
  const sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')
  const endsOnSameDay = event.startTime.isSame(event.endTime, 'day')

  const endFormat = endsOnSameDay ? 'h:mm A' : 'MMM. D h:mm A'
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
    const endFormat =
      endTimeFormatted === midnightTime ? 'MMM. D' : 'MMM. D h:mm A'
    end = `${event.endTime.format(endFormat)}`
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
