// @flow
export type BuildingStatusType = 'Open'|'Closed'|'Almost Closed';
export type DayOfWeekType = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
export type BuildingInfoType = {
  name: string,
  image: string,
  times: {
    hours: {
      [key: DayOfWeekType]: [string, string, ?{nextDay: boolean}],
    },
  },
};
