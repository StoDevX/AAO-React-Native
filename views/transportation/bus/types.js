// @flow
type DayOfWeekType = 'su'|'mo'|'tu'|'we'|'th'|'fr'|'sa';

export type BusLineType = {
  line: string,
  schedules: BusScheduleType[],
};

export type BusScheduleType = {
  days: DayOfWeekType[],
  stops: BusStopType[],
  coordinates?: [number, number][],
  times: BusTimeListType[],
};

export type BusStopType = string | {
  name: string,
  latlong: [number, number],
};

export type BusTimeListType = (string|false)[];
