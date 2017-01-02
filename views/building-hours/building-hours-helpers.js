// @flow
import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'
const TIME_FORMAT = 'h:mma'
const RESULT_FORMAT = 'h:mma'

import type {BuildingType, NamedBuildingScheduleType, SingleBuildingScheduleType, DayOfWeekEnumType} from './types'
import type momentT from 'moment'
import flatten from 'lodash/flatten'
import sortBy from 'lodash/sortBy'
import {data as chapelData} from '../../docs/chapel'
const {chapelSchedule} = chapelData

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

const getDayOfWeek = (m: momentT) => ((m.format('dd'): any): DayOfWeekEnumType)

export function isChapelTime(m: momentT, schedules: SingleBuildingScheduleType[]=chapelSchedule): boolean {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))
  if (!sched) {
    return false
  }

  return _isBuildingOpenAtMoment(sched, m)
}

export function formatChapelTime(m: momentT, schedules: SingleBuildingScheduleType[]=chapelSchedule): string {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))
  if (!sched) {
    return 'No chapel'
  }
  return formatBuildingTimes(sched, m)
}

export function getTimeUntilChapelCloses(m: momentT, schedules: SingleBuildingScheduleType[]=chapelSchedule): string {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))
  if (!sched) {
    return 'No chapel'
  }
  let {close} = parseHours(sched, m)
  return m.to(close)
}

export function formatBuildingTimes(schedule: SingleBuildingScheduleType, m: momentT): string {
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

export function _isBuildingOpenAtMoment(schedule: SingleBuildingScheduleType, m: momentT): boolean {
  let {open, close} = parseHours(schedule, m)
  return m.isBetween(open, close, 'minute', '[)')
}

export function isBuildingOpenAtMoment(schedule: SingleBuildingScheduleType, m: momentT): boolean {
  if (isChapelTime(m)) {
    return false
  }
  return _isBuildingOpenAtMoment(schedule, m)
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

  let dayOfWeek = getDayOfWeek(m)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return [[false, null, 'Hours unknown']]
  }

  let results = schedules.map(set => {
    let prefix = set.title
    if (set.closedForChapelTime && isChapelTime(m)) {
      return [[false, prefix, `Closed for chapel: ${formatChapelTime(m)}`]]
    }

    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return [[false, prefix, 'Closed today']]
    }

    return filteredSchedules.map(schedule => {
      let isActive = isBuildingOpenAtMoment(schedule, m)
      let status = formatBuildingTimes(schedule, m)
      if (set.isPhysicallyOpen === false) {
        isActive = false
      }
      return [isActive, prefix, status]
    })
  })

  return flatten(results)
}

export function getShortBuildingStatus(info: BuildingType, m: momentT): string {
  let dayOfWeek = getDayOfWeek(m)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return 'Closed'
  }

  let statuses = schedules.map(set => {
    if (set.isPhysicallyOpen === false) {
      return 'Closed'
    }

    if (set.closedForChapelTime && isChapelTime(m)) {
      return 'Chapel'
    }

    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return 'Closed'
    }

    return filteredSchedules.map(schedule => getStatusOfBuildingAtMoment(schedule, m))
  })

  return flatten(statuses).find(status => status !== 'Closed') || 'Closed'
}

export function isBuildingOpen(info: BuildingType, m: momentT): boolean {
  let dayOfWeek = getDayOfWeek(m)

  let schedules = normalizeBuildingSchedule(info)
  if (!schedules.length) {
    return false
  }

  let results = schedules.map(set => {
    if (set.isPhysicallyOpen === false) {
      return false
    }
    if (set.closedForChapelTime && isChapelTime(m)) {
      return false
    }

    let filteredSchedules = set.hours.filter(sched => sched.days.includes(dayOfWeek))
    if (!filteredSchedules.length) {
      return false
    }

    return filteredSchedules.map(schedule => isBuildingOpenAtMoment(schedule, m))
  })

  return flatten(results).find(status => status !== false) || false
}

const daysOfTheWeek: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
export function summarizeDays(days: DayOfWeekEnumType[]): string {
  // If one day is given: return the full name of that day.
  //    ['Fr'] => 'Friday'
  // If multiple contiguous days are given: return the bookended 3-letter days
  //    ['Mo', 'Tu', 'We'] => 'Mon — Wed'
  // If multiple non-contiguous days are given: return the 2-letter days, comma-separated
  //    ['Fr', 'Sa'] => 'Fr, Sa'
  // If the span has a common shorthand: return that shorthand
  //    ['Mo', 'Tu', 'We', 'Th', Fr'] => "Weekdays"

  if (days.length === 1) {
    return moment(days[0], 'dd').format('dddd')
  }

  // Sort the days so we have fewer edge-cases
  let sortedDays = sortBy(days, d => daysOfTheWeek.indexOf(d))

  let startDay = sortedDays[0]
  let endDay = sortedDays[sortedDays.length-1]

  // Get the indices of the start/end days from the master list of all days
  let startIndex = daysOfTheWeek.indexOf(startDay)
  let endIndex = daysOfTheWeek.indexOf(endDay)

  // if the number of days given is not the number of days in the span,
  // join the list. (There's no point to converting them here.)
  if (endIndex - startIndex !== sortedDays.length - 1) {
    return sortedDays.join(', ')
  }

  // Now we check for common shorthands
  if (startDay === 'Mo' && endDay === 'Fr') {
    return 'Weekdays'
  } else if (startDay === 'Sa' && endDay === 'Su') {
    return 'Weekend'
  } else if (startDay === 'Mo' && endDay === 'Su') {
    return 'Every day'
  }

  // And if we don't find anything, we need to return the spanned-days format
  let start = moment(startDay, 'dd').format('ddd')
  let end = moment(endDay, 'dd').format('ddd')

  return `${start} — ${end}`
}

export function normalizeBuildingSchedule(info: BuildingType): NamedBuildingScheduleType[] {
  let schedules = info.schedule
  if (!schedules) {
    return []
  }

  return schedules
}
