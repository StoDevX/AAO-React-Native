// @flow
export type BuildingStatusType = 'Open'|'Closed'|'Almost Closed';
export type DayOfWeekType = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
export type BuildingHoursType = [string, string, ?{nextDay: boolean}];
export type BuildingInfoType = {
  name: string,
  image: string,
  times: {
    hours: {
      [key: string|DayOfWeekType]: BuildingHoursType,
    },
  },
};
