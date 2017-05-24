// @flow
import groupBy from 'lodash/groupBy'
import type {EventType} from './types'
import type moment from 'moment-timezone'

export function groupEvents(
  events: EventType[],
  now: moment,
): {[key: string]: EventType[]} {
  return groupBy(events, event => {
    if (event.startTime.isBefore(now, 'day')) {
      return 'Ongoing'
    }
    if (event.startTime.isSame(now, 'day')) {
      return 'Today'
    }
    return event.startTime.format('ddd  MMM Do')
  })
}
