// @flow
import type {FancyBusTimeListType} from '../types'
import type moment from 'moment'
import head from 'lodash/head'
import last from 'lodash/last'

export function getSetOfStopsForNow(
  scheduledMoments: FancyBusTimeListType[],
  now: moment,
): FancyBusTimeListType {
  // Given a list of bus loops, we need to find the loop for the current time.
  // There are three possible cases:

  // We might be checking before the first bus has run;
  const firstBus = head(head(scheduledMoments))
  if (now.isSameOrBefore(firstBus, 'minute')) {
    return head(scheduledMoments)
  }

  // We might be checking while the bus is running;
  let previousEnd = firstBus
  for (let moments of scheduledMoments) {
    const startTime = previousEnd
    const endTime = last(moments)

    // A note on Momentjs inclusivity: A [ indicates inclusion of a value. A (
    // indicates exclusion. If the inclusivity parameter is used, both
    // indicators must be passed.
    if (now.isBetween(startTime, endTime, null, '[]')) {
      return moments
    }

    previousEnd = endTime
  }

  // Or we might be after the bus has quit for the day
  return last(scheduledMoments)
}
