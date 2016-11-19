// @flow
import type moment from 'moment'
type DayOfWeekType = 'su'|'mo'|'tu'|'we'|'th'|'fr'|'sa';

export type BusLineType = {
  line: string,
  schedules: BusScheduleType[],
};

export type BusScheduleType = {
  days: DayOfWeekType[],
  stops: BusStopType[],
  coordinates?: [number, number][],
  times: PlainBusTimeListType[],
};

export type BusStopType = string | {
  name: string,
  latlong: [number, number],
};

export type PlainBusTimeListType = Array<string|false>;
export type FancyBusTimeListType = Array<moment|false>;
