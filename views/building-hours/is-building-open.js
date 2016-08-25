// @flow
import {getBuildingHours} from './get-building-hours'

import type {BuildingStatusType, BuildingInfoType} from './types'

export function isBuildingOpen(hoursInfo: BuildingInfoType): BuildingStatusType {
  let hours = getBuildingHours(hoursInfo)
  if (!hours) {
    return 'Closed'
  }

  let {open, close, current} = hours

  if (current.isBetween(open, close)) {
    if (current.clone().add(30, 'min').isAfter(close)) {
      return 'Almost Closed'
    }
    return 'Open'
  }
  return 'Closed'
}
