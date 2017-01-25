// @flow
import type momentT from 'moment'

export type EventType = {
  summary: string,
  location: string,
  startTime: momentT,
  endTime: momentT,
  style?: any,
  isOngoing: bool,
}
