// @flow
import type moment from 'moment'

type GoogleTimeType = {
  dateTime: string,
};
export type GoogleEventType = {
  summary: string,
  start: GoogleTimeType,
  end: GoogleTimeType,
  location: string,
};

export type PresenceEventType = {
  uri: string,
  eventName: string,
  organizationName: string,
  organizationUri: string,
  description: string,
  location: string,
  rsvpLink?: string,
  contactName?: string,
  contactEmail?: string,
  hasCoverImage?: boolean,
  photoType: 'upload'|'search',
  photoUriWithVersion: string,
  startDateTimeUtc: string,
  endDateTimeUtc: string,
  tags: string[],
};

export type EventType = {
  summary: string,
  location: string,
  startTime: moment,
  endTime: moment,
  isOngoing: bool,
}
