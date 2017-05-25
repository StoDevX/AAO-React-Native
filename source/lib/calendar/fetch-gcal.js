// @flow

import {getGoogleCalendarUrl} from './get-gcal-url'
import moment from 'moment-timezone'
import sortBy from 'lodash/sortBy'
import uuid from 'uuid/v4'
import type {
  GoogleEventType,
  GoogleResponseType,
  EventType,
  GcalArgsType,
} from './types'

export class GoogleCalendarError extends Error {}

export async function fetchGoogleCalendar(
  calendarId: string,
  args?: GcalArgsType,
): Promise<EventType[]> {
  const url = getGoogleCalendarUrl(calendarId, args)

  // google makes you opt-in to gzip
  const req = await rawFetch(url, {
    headers: new Headers({
      'User-Agent': 'AllAboutOlaf (gzip)',
      'Accept-Encoding': 'gzip',
    }),
  })

  if (!(req.status >= 200 && req.status < 300)) {
    const result = await req.json()
    if (result.error) {
      throw new GoogleCalendarError(result.error.message)
    }
  }

  const result: GoogleResponseType = await req.json()

  if (result.error) {
    throw new GoogleCalendarError(result.error.message)
  }

  if (!result.items) {
    return []
  }

  const events = convertEvents(result.items)

  return sortBy(events, (e: EventType) => e.startTime)
}

function convertEvents(data: GoogleEventType[]): EventType[] {
  return data.map(event => ({
    startTime: moment(event.start.date || event.start.dateTime || null),
    endTime: moment(event.end.date || event.end.dateTime || null),
    summary: event.summary || '',
    location: event.location || '',
    id: event.id || uuid(),
    description: event.description || '',
  }))
}
