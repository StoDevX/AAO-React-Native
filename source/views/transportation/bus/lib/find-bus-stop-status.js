// @flow

import type moment from 'moment'
import type {BusTimetableEntry} from '../types'
import type {BusStateEnum} from './get-current-bus-iteration'

export type BusStopStatusEnum = 'at' | 'before' | 'after' | 'skip'

type Args = {|
  +stop: BusTimetableEntry,
  +busStatus: BusStateEnum,
  +departureIndex: null | number,
  +now: moment,
|}

export function findBusStopStatus(args: Args): BusStopStatusEnum {
  const {stop, busStatus, departureIndex, now} = args

  let stopStatus: BusStopStatusEnum = 'skip'
  let arrivalTime: false | ?moment = false

  switch (busStatus) {
    case 'before-start': {
      stopStatus = 'before'
      arrivalTime = stop.departures[0]
      break
    }

    case 'after-end': {
      stopStatus = 'after'
      arrivalTime = stop.departures[stop.departures.length - 1]
      break
    }

    default: {
      arrivalTime =
        departureIndex === null ? false : stop.departures[departureIndex]

      if (arrivalTime && now.isAfter(arrivalTime, 'minute')) {
        stopStatus = 'after'
      } else if (arrivalTime && now.isSame(arrivalTime, 'minute')) {
        stopStatus = 'at'
      } else if (arrivalTime !== false) {
        stopStatus = 'before'
      } else {
        stopStatus = 'skip'
      }
    }
  }

  if (arrivalTime === false) {
    stopStatus = 'skip'
  }

  return stopStatus
}
