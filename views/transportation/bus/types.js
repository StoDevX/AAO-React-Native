// @flow
type DayOfWeekType = 'su'|'mo'|'tu'|'we'|'th'|'fr'|'sa';

export type BusLineType = {
  line: string,
  schedules: BusScheduleType[],
};

export type BusScheduleType = {
  days: DayOfWeekType[],
  stops: string[],
  times: BusTimeListType[],
};

export type BusTimeListType = (string|false)[];
