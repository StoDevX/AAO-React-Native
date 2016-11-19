// @flow
import type {FancyBusTimeListType} from './types'
import type moment from 'moment'
import head from 'lodash/head'
import last from 'lodash/last'
import find from 'lodash/find'

export default function getSetOfStopsForNow(
  scheduledMoments: FancyBusTimeListType[],
  now: moment
): FancyBusTimeListType {
  let moments: ?Array<moment|false> = find(scheduledMoments, moments => {
    const startTime = head(moments)
    const endTime = last(moments)
    // Momentjs inclusivity: A [ indicates inclusion of a value. A ( indicates
    // exclusion. If the inclusivity parameter is used, both indicators must
    // be passed.
    return now.isBetween(startTime, endTime, null, '[]')
  })

  if (moments) {
    return moments
  }

  let firstBus = head(head(scheduledMoments))
  if (now.isSameOrBefore(firstBus, 'minute')) {
    return head(scheduledMoments)
  }

  return last(scheduledMoments)
}
