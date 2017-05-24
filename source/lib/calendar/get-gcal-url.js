// @flow

import qs from 'querystring'
import {GOOGLE_CALENDAR_API_KEY} from '../../lib/config'

export function getGoogleCalendarUrl(calendarId: string) {
  let calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
  let params = {
    maxResults: 50,
    orderBy: 'startTime',
    showDeleted: false,
    singleEvents: true,
    timeMin: new Date().toISOString(),
    key: GOOGLE_CALENDAR_API_KEY,
  }
  return `${calendarUrl}?${qs.stringify(params)}`
}
