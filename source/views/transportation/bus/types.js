// @flow
import type moment from 'moment'
export type DayOfWeekType = 'Su' | 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa'

export type BusLineType = {
  line: string,
  schedules: BusScheduleType[],
}

export type BusScheduleType = {
  days: DayOfWeekType[],
  stops: BusStopType[],
  coordinates?: [number, number][],
  times: PlainBusTimeListType[],
}

export type BusStopType = string

export type PlainBusTimeListType = Array<string | false>
export type FancyBusTimeListType = Array<moment | false>
