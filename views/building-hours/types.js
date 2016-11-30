// @flow

export type BuildingStatusType = 'Open'|'Closed'|'Almost Closed'|'Almost Open';

export type DayOfWeekEnumType = 'Mo'|'Tu'|'We'|'Th'|'Fr'|'Sa'|'Su';

export type BreakNameEnumType =
  'fall' |
  'thanksgiving' |
  'christmasfest' |
  'winter' |
  'interim' |
  'spring' |
  'easter' |
  'summer';

export type SingleBuildingScheduleType = {
  days: DayOfWeekEnumType[],
  from: string,
  to: string,
};

export type NamedBuildingScheduleType = {
  title: 'Hours'|string,
  hours: SingleBuildingScheduleType[],
};

export type BreakScheduleContainerType = {
  [key: BreakNameEnumType]: SingleBuildingScheduleType[],
};

export type BuildingType = {
  name: string,
  notes?: string,
  image?: string,
  category: string,
  schedule?: SingleBuildingScheduleType[],
  namedSchedule?: NamedBuildingScheduleType[],
  breakSchedule: BreakScheduleContainerType,
};
