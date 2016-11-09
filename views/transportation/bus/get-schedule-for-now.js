// @flow
import type {BusScheduleType} from './types'
import moment from 'moment-timezone'

const allDaysOfWeek = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']

export default function getScheduleForNow(
  schedules: BusScheduleType[],
  now: typeof moment
): BusScheduleType|void {
  const thisWeekday = now.day() // 0-6, Sunday to Saturday.

  return schedules.find(schedule => {
    return schedule.days
      .map(day => allDaysOfWeek.indexOf(day)) // turn days into numbers
      .includes(thisWeekday)
  })
}
