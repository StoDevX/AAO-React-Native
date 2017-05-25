// @flow

import qs from 'querystring'
import {GOOGLE_CALENDAR_API_KEY} from '../../lib/config'
import type {GcalArgsType} from './types'

const defaultArgs = (): GcalArgsType => ({
  maxResults: 50,
  singleEvents: true,
  timeMin: new Date().toISOString(),
  key: GOOGLE_CALENDAR_API_KEY,
  fields: 'summary,description,items(summary,start/date,start/dateTime,end/date,end/dateTime,id,location,description)',
})

export function getGoogleCalendarUrl(
  calendarId: string,
  args: GcalArgsType = {},
) {
  const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
  const params: GcalArgsType = {
    ...defaultArgs(),
    ...args,
  }
  return `${calendarUrl}?${qs.stringify(params)}`
}
