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

export type EventType = {
  summary: string,
  location: string,
  startTime: moment,
  endTime: moment,
  isOngoing: bool,
}
