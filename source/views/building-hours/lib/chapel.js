// @flow
import moment from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isScheduleReallyOpenAtMoment} from './is-schedule-open'
import {formatBuildingTimes} from './format-times'
import {parseHours} from './parse-hours'

import {data as chapelData} from '../../../../docs/chapel.json'
const {chapelSchedule} = chapelData

export function isChapelTime(
  m: moment,
  schedules: SingleBuildingScheduleType[] = chapelSchedule,
): boolean {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))

  if (!sched) {
    return false
  }

  return isScheduleReallyOpenAtMoment(sched, m)
}

export function formatChapelTime(
  m: moment,
  schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))

  if (!sched) {
    return 'No chapel'
  }

  return formatBuildingTimes(sched, m)
}

export function getTimeUntilChapelCloses(
  m: moment,
  schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
  let dayOfWeek = getDayOfWeek(m)
  let sched = schedules.find(sched => sched.days.includes(dayOfWeek))

  if (!sched) {
    return 'No chapel'
  }

  let {close} = parseHours(sched, m)

  return m
    .clone()
    .seconds(0)
    .to(close)
}
