// @flow
import moment from 'moment-timezone'
import flatten from 'lodash/flatten'
import type {BuildingType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isChapelTime, formatChapelTime} from './chapel'
import {isScheduleOpenAtMoment} from './is-schedule-open'
import {formatBuildingTimes} from './format-times'

export function getDetailedBuildingStatus(
  info: BuildingType,
  m: moment,
): Array<{isActive: boolean, label: string | null, status: string}> {
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

  let schedules = info.schedule || []
  if (!schedules.length) {
    return [{isActive: false, label: null, status: 'Hours unknown'}]
  }

  let results = schedules.map(set => {
    let label = set.title
    if (set.closedForChapelTime && isChapelTime(m)) {
      return [
        {
          isActive: false,
          label,
          status: `Closed for chapel: ${formatChapelTime(m)}`,
        },
      ]
    }

    let filteredSchedules = set.hours.filter(sched =>
      sched.days.includes(dayOfWeek),
    )
    if (!filteredSchedules.length) {
      return [{isActive: false, label, status: 'Closed today'}]
    }

    return filteredSchedules.map(schedule => {
      let isActive = isScheduleOpenAtMoment(schedule, m)
      let status = formatBuildingTimes(schedule, m)
      if (set.isPhysicallyOpen === false) {
        isActive = false
      }
      return {isActive, label, status}
    })
  })

  return flatten(results)
}
