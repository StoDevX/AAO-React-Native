// @flow

import type moment from 'moment'

export type BuildingStatusType =
  | 'Open'
  | 'Closed'
  | 'Almost Closed'
  | 'Almost Open'
  | 'Chapel'

export type DayOfWeekEnumType = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su'

export type DayScheduleType = {
  open: moment,
  close: moment,
  title: string,
  location: string,
  notes: string,
  tags: {
    chapel?: boolean,
    'physically-open'?: boolean,
  },
}

export type ScheduleType = {
  name: string,
  instances: Array<DayScheduleType>,
}

export type BuildingType = {
  // schedule names to list of schedules
  name: string,
  category: string,
  schedules: Array<ScheduleType>,
}

export type BuildingGroupType = {
  [key: string]: Array<BuildingType>,
}
