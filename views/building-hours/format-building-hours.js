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


  if (openStatus === 'Almost Closed'){
    let closingIn = close.diff(now, 'minutes') + 1

    return `Closing in ${closingIn} minutes`
  } else {
    let openString = open.format(RESULT_FORMAT)
    let closeString = close.format(RESULT_FORMAT)

    return `${openString} / ${closeString} – ${openStatus}`
  }
}
