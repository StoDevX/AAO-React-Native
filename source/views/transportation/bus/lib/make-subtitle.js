// @flow

import find from 'lodash/find'
import findLast from 'lodash/findLast'
import type moment from 'moment'
import type {DepartureTimeList} from '../types'

const isTruthy = x => x

type Args = {
  now: moment,
  stopTimes: DepartureTimeList,
  isLastBus: boolean,
}

export function makeSubtitle({now, stopTimes, isLastBus}: Args) {
  const first = find(stopTimes, isTruthy)
  const last = findLast(stopTimes, isTruthy)

  if (!first || !last) {
    return 'Not running today'
  }

  if (now.isBefore(first)) {
    const startsIn = now
      .clone()
      .seconds(0)
      .to(first)
    return `Starts ${startsIn}`
  }

  if (now.isAfter(last)) {
    return 'Over for Today'
  }

  if (isLastBus) {
    return 'Last Bus'
  }

  return 'Running'
}
