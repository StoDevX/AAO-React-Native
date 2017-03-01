// @flow
import type {BusScheduleType, DayOfWeekType} from '../types'
import moment from 'moment-timezone'

const allDaysOfWeek: DayOfWeekType[] = [
  'Su',
  'Mo',
  'Tu',
  'We',
  'Th',
  'Fr',
  'Sa',
]

export function getScheduleForNow(
  schedules: BusScheduleType[],
  now: typeof moment,
): BusScheduleType | void {
  const thisWeekday = now.day() // 0-6, Sunday to Saturday.

  return schedules.find(schedule => {
    return schedule.days
      .map(day => allDaysOfWeek.indexOf(day)) // turn days into numbers
      .includes(thisWeekday)
  })
}
