// @flow

import type {BusTimetableEntry, DepartureTimeList} from '../types'
import type {BusStateEnum} from './get-current-bus-iteration'

type Args = {|
  +stop: BusTimetableEntry,
  +busStatus: BusStateEnum,
  +departureIndex: null | number,
|}

export function findRemainingDeparturesForStop(args: Args): DepartureTimeList {
  const {stop, busStatus, departureIndex} = args

  if (!stop) {
    return []
  }

  switch (busStatus) {
    case 'before-start': {
      return stop.departures.slice(0)
    }

    case 'after-end': {
      return stop.departures.slice(-1)
    }

    default: {
      return departureIndex !== null
        ? stop.departures.slice(departureIndex)
        : stop.departures.slice(0)
    }
  }
}
