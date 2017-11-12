// @flow

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'
import moment from 'moment-timezone'

export const parseTime = (now: moment) => (
  time: string | false,
): null | moment => {
  // either pass `false` through or return a parsed time
  if (time === false) {
    return null
  }

  // interpret in Central time
  let m = moment.tz(time, TIME_FORMAT, true, TIMEZONE)

  // and set the date to today
  m.dayOfYear(now.dayOfYear())

  return m
}
