// @flow
const RESULT_FORMAT = 'h:mma'

import {isBuildingOpen} from './is-building-open'
import {getBuildingHours} from './get-building-hours'
import type {BuildingInfoType} from './types'
import type momentT from 'moment'

export function formatBuildingHours(hoursInfo: BuildingInfoType, now: momentT): string {
  let hours = getBuildingHours(hoursInfo, now)
  if (!hours) {
    return 'Closed today'
  }

  let {open, close} = hours
  let openStatus = isBuildingOpen(hoursInfo, now)
  let openString = open.format(RESULT_FORMAT)
  let closeString = close.format(RESULT_FORMAT)
  closeString = closeString === '12:00am' ? 'Midnight' : closeString

  if (openStatus === 'Almost Closed') {
    return `Closing ${now.to(close)}`
  } else if (openStatus === 'Almost Open') {

    return `Opening ${now.to(open)}`
  } else {
    return `${openString} / ${closeString} – ${openStatus}`
  }
}
