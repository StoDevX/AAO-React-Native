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
  if (firstBus !== false && now.isSameOrBefore(firstBus, 'minute')) {
    console.log('early return')
    return head(scheduledMoments)
  }

  // We might be checking while the bus is running;
  let previousEnd = firstBus
  for (const moments of scheduledMoments) {
    const startTime = previousEnd
    const endTime = last(moments)

    console.log(startTime, endTime)
    if (startTime === false || endTime === false) {
      continue
    }

    // A note on Momentjs inclusivity: A [ indicates inclusion of a value. A (
    // indicates exclusion. If the inclusivity parameter is used, both
    // indicators must be passed.
    if (now.isBetween(startTime, endTime, null, '[]')) {
      console.log(
        `middle return: startTime "${String(startTime)}", endTime "${String(
          endTime,
        )}"`,
      )
      return moments
    }

    previousEnd = endTime
  }

  // Or we might be after the bus has quit for the day
  console.log('final return')
  return last(scheduledMoments)
}
