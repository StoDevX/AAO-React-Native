// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'h:mma'
const RESULT_FORMAT = 'h:mma'

import type {BuildingType, NamedBuildingScheduleType, SingleBuildingScheduleType, DayOfWeekEnumType} from './types'
import type momentT from 'moment'
import flatten from 'lodash/flatten'

type HourPairType = {open: momentT, close: momentT};

export function parseHours({from: fromTime, to: toTime}: SingleBuildingScheduleType, m: momentT): HourPairType {
  let dayOfYear = m.dayOfYear()

  // if the moment is before 3am
  if (m.hour() < 2) {
    dayOfYear -= 1
  }

  let open = moment.tz(fromTime, TIME_FORMAT, true, CENTRAL_TZ)
  open.dayOfYear(dayOfYear)

  let close = moment.tz(toTime, TIME_FORMAT, true, CENTRAL_TZ)
  close.dayOfYear(dayOfYear)

  if (close.isBefore(open)) {
    close.add(1, 'day')
  }

  return {open, close}
}

export function formatStatusOfBuildingAtMoment(schedule: SingleBuildingScheduleType, m: momentT): string {
  let {open, close} = parseHours(schedule, m)

  let openString = open.format(RESULT_FORMAT)
  let closeString = close.format(RESULT_FORMAT)
  closeString = closeString === '12:00am' ? 'Midnight' : closeString
  return `${openString} — ${closeString}`
}

export function getStatusOfBuildingAtMoment(schedule: SingleBuildingScheduleType, m: momentT): string {
  let {open, close} = parseHours(schedule, m)

  if (m.isBefore(open) && m.clone().add(30, 'minutes').isSameOrAfter(open)) {
    return `Opens ${m.to(open)}`
  }
  if (m.isBetween(open, close, 'minute', '[)')) {
    if (m.clone().add(30, 'minutes').isSameOrAfter(close)) {
      return `Closes ${m.to(close)}`
    }
    return 'Open'
  }
  return 'Closed'
}

export function isBuildingOpenAtMoment(schedule: SingleBuildingScheduleType, m: momentT): boolean {
  let {open, close} = parseHours(schedule, m)
  return m.isBetween(open, close, 'minute', '[)')
}

export function getDetailedBuildingStatus(info: BuildingType, m: momentT): [boolean, string|null, string][] {
  // Friday: 9:00am – Midnight
  // -- or --
  // Friday Breakfast: 7:00am – 9:45am
  // Friday Lunch: 10:30am – 2:00pm
  // Friday Dinner: 4:30pm – 7:30pm
  // -- alternately --
  // Friday Faculty/Staff Swim: 7:00am – 9:45am
  // Friday Lap Swim: 12:45pm – 2:00pm
  // Friday Open Swim: 7:00am – 2:00pm

  let dayOfWeek = ((m.format('dd'): any): DayOfWeekEnumType)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return [[false, null, 'Hours unknown']]
  }

  let results = schedules.map(set => {
    let prefix = set.title
    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return [[false, prefix, 'Closed today']]
    }

    return filteredSchedules.map(schedule => {
      let isActive = isBuildingOpenAtMoment(schedule, m)
      let status = formatStatusOfBuildingAtMoment(schedule, m)
      return [isActive, prefix, status]
    })
  })

  return flatten(results)
}

export function getShortBuildingStatus(info: BuildingType, m: momentT): string {
  let dayOfWeek = ((m.format('dd'): any): DayOfWeekEnumType)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return 'Closed'
  }

  let statuses = schedules.map(set => {
    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return 'Closed'
    }

    return filteredSchedules.map(schedule => getStatusOfBuildingAtMoment(schedule, m))
  })

  return flatten(statuses).find(status => status !== 'Closed') || 'Closed'
}

export function isBuildingOpen(info: BuildingType, m: momentT): boolean {
  let dayOfWeek = ((m.format('dd'): any): DayOfWeekEnumType)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return false
  }

  let results = schedules.map(set => {
    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return false
    }

    return filteredSchedules.map(schedule => isBuildingOpenAtMoment(schedule, m))
  })

  return flatten(results).find(status => status !== false) || false
}

export function summarizeDays(days: DayOfWeekEnumType[]) {
  if (days.length === 1) {
    return moment(days[0], 'dd').format('dddd')
  }

  let start = moment(days[0], 'dd').format('ddd')
  let end = moment(days[days.length-1], 'dd').format('ddd')

  if (start === 'Mon' && end === 'Fri') {
    return 'Weekdays'
  } else if (start === 'Sat' && end === 'Sun') {
    return 'Weekends'
  } else if (start === 'Mon' && end === 'Sun') {
    return 'Every day'
  }

  return `${start} — ${end}`
}

export function normalizeBuildingSchedule(info: BuildingType): NamedBuildingScheduleType[] {
  let schedules = info.namedSchedule || info.schedule && [{title: 'Hours', hours: info.schedule}]
  if (!schedules) {
    return []
  }

  return schedules
}
