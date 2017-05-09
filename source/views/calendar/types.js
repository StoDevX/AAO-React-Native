// @flow
import type moment from 'moment'

type GoogleTimeType = {
  dateTime: string,
}
export type GoogleEventType = {
  summary?: string,
  start: GoogleTimeType,
  end: GoogleTimeType,
  location?: string,
}

type EmbeddedEventDetailType = {type: 'google', data: GoogleEventType}

export type EventType = {
  summary: string,
  location: string,
  startTime: moment,
  endTime: moment,
  isOngoing: boolean,
  extra: EmbeddedEventDetailType,
}
