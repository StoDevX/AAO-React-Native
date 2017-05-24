// @flow

import type {EventType} from './types'
import moment from 'moment-timezone'

export function formatTimes(event: EventType, now: moment) {
  const eventLength = moment
    .duration(event.endTime.diff(event.startTime))
    .asHours()

  const allDay = eventLength === 24
  const ongoing = event.startTime.isBefore(now, 'day')
  const multiDay = event.startTime.dayOfYear() !== event.endTime.dayOfYear()
  const sillyZeroLength = event.startTime.isSame(event.endTime, 'minute')

  let start, end
  if (ongoing) {
    start = event.startTime.format('MMM. D')
    end = event.endTime.format('MMM. D')
  } else if (multiDay) {
    start = event.startTime.format('h:mm A')
    end = `to ${event.endTime.format('MMM D h:mm A')}`
  } else if (sillyZeroLength) {
    start = event.startTime.format('h:mm A')
    end = 'until ???'
  } else {
    start = event.startTime.format('h:mm A')
    end = event.endTime.format('h:mm A')
  }

  return {start, end, allDay}
}
