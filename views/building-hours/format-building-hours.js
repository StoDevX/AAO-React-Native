// @flow
const RESULT_FORMAT = 'h:mma'

import {isBuildingOpen} from './is-building-open'
import {getBuildingHours} from './get-building-hours'
import type {BuildingInfoType} from './types'

export function formatBuildingHours(hoursInfo: BuildingInfoType): string {
  let hours = getBuildingHours(hoursInfo)
  if (!hours) {
    return 'Closed today'
  }

  let {open, close} = hours
  let isOpen = isBuildingOpen(hoursInfo)

  let openString = open.format(RESULT_FORMAT)
  let closeString = close.format(RESULT_FORMAT)

  return `${openString} / ${closeString} – ${isOpen}`
}
