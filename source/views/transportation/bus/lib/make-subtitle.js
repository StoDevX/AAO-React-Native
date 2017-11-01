// @flow

import head from 'lodash/head'
import last from 'lodash/last'
import findLast from 'lodash/findLast'
import type moment from 'moment'
import {type FancyBusTimeListType} from '../types'

type Args = {
  now: moment,
  moments: FancyBusTimeListType,
  isLastBus: boolean,
}
;[]

export function makeSubtitle({now, moments, isLastBus}: Args) {
  let lineDetail = 'Running'

  const onlyMoments = moments.filter(m => m !== false)

  if (now.isBefore(head(onlyMoments))) {
    const startsIn = now
      .clone()
      .seconds(0)
      .to(head(onlyMoments))
    lineDetail = `Starts ${startsIn}`
  } else if (now.isAfter(last(onlyMoments))) {
    lineDetail = 'Over for Today'
  } else if (isLastBus) {
    lineDetail = 'Last Bus'
  }

  return lineDetail
}
