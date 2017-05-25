// @flow
import type moment from 'moment'

export type GcalArgsType = {
  key?: string,
  timeMin?: string,
  timeMax?: string,
  singleEvents?: boolean,
  orderBy?: 'startTime' | 'updated',
  maxResults?: number,
}

export type GoogleEventType = {
  summary?: string,
  start: {date?: string, dateTime?: string},
  end: {date?: string, dateTime?: string},
  id: string,
  location?: string,
  description?: string,
}
export type GoogleResponseType = {
  summary?: string,
  description?: string,
  error?: {
    code: number,
    errors: any[],
    message: string,
  },
  items?: GoogleEventType[],
}

export type EventType = {
  startTime: moment,
  endTime: moment,
  summary: string,
  location: string,
  id: string,
  description: string,
}
