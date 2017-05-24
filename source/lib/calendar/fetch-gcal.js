// @flow

import {getGoogleCalendarUrl} from './get-gcal-url'
import moment from 'moment-timezone'
import type {GoogleEventType, EventType} from './types'

export class GoogleCalendarError extends Error {}

export async function fetchGoogleCalendar(
  calendarId: string,
): Promise<EventType[]> {
  const url = getGoogleCalendarUrl(calendarId)

  const result = await fetchJson(url)
  if (result.error) {
    throw new GoogleCalendarError(result.error.message)
  }

  return convertEvents(result.items)
}

function convertEvents(data: GoogleEventType[]): EventType[] {
  return data.map(event => ({
    startTime: moment(event.start.date || event.start.dateTime),
    endTime: moment(event.end.date || event.end.dateTime),
    summary: event.summary || '',
    location: event.location || '',
    extra: {type: 'google', data: event},
  }))
}
