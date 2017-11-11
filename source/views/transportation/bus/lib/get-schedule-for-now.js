// @flow
import type {BusSchedule, DayOfWeek} from '../types'
import moment from 'moment-timezone'

const allDaysOfWeek: DayOfWeek[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getScheduleForNow(
  schedules: BusSchedule[],
  now: moment,
): BusSchedule {
  // now.day returns 0-6, Sunday to Saturday
  const thisWeekday = allDaysOfWeek[now.day()]

  const schedule = schedules.find(schedule =>
    schedule.days.includes(thisWeekday),
  )

  if (!schedule) {
    return {
      days: [thisWeekday],
      timetable: [],
      coordinates: {},
      stops: [],
      times: [],
    }
  }

  return schedule
}
