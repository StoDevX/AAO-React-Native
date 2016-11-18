// @flow
import map from 'lodash/map'
import type momentT from 'moment'
import type {BuildingInfoType, DayOfWeekType} from './types'
import {parseBuildingHours} from './get-building-hours'

const dayToDayMap: Map<DayOfWeekType, string> = new Map([
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
])
const dayToDayMapArray = Array.from(dayToDayMap.entries())

export function allBuildingHours(info: BuildingInfoType, now: momentT) {
  return map(dayToDayMapArray, ([shortDay, longDay]) => {
    let hourSet = info.times.hours[shortDay]
    if (!hourSet) {
      return `${longDay}: Closed`
    }

    let {open, close} = parseBuildingHours(hourSet, now)
    return `${longDay}: ${open.format('h:mm a')} – ${close.format('h:mm a')}`
  })
}
