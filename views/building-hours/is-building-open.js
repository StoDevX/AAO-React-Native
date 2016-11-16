// @flow
import {getBuildingHours} from './get-building-hours'
import type momentT from 'moment'
import type {BuildingStatusType, BuildingInfoType} from './types'

export function isBuildingOpen(hoursInfo: BuildingInfoType, now: momentT): BuildingStatusType {
  let hours = getBuildingHours(hoursInfo, now)
  if (!hours) {
    return 'Closed'
  }

  let {open, close} = hours

  if (now.isBetween(open, close)) {
    if (now.clone().add(30, 'min').isAfter(close)) {
      return 'Almost Closed'
    }
    return 'Open'
  }
  return 'Closed'
}
