// @flow
import moment from 'moment-timezone'
import sortBy from 'lodash/sortBy'
import type {DayOfWeekEnumType} from '../types'

import {daysOfTheWeek} from './constants'

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
  let endDay = sortedDays[sortedDays.length - 1]

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
