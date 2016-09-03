// @flow
export type OtherModeType = {
  name: string,
  description: string,
  url: string,
};

export type BusLineType = {
  line: string,
  schedules: DailyBusSchedulesType,
};

export type DailyBusSchedulesType = {
  [key: BusScheduleDaysType]: SingleBusScheduleType,
};

export type SingleBusScheduleType = BusStopType[];

export type BusScheduleDaysType = string;

export type BusStopType = {
  location: string,
  times: string[],
};
