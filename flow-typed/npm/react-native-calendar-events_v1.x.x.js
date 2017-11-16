// flow-typed signature: 0c83aa5e46a756086bcc60bfd20abf29
// flow-typed version: <<STUB>>/react-native-calendar-events_v1.4.3/flow_v0.56.0

declare module 'react-native-calendar-events' {
  declare type CalendarIdentifier = string;

  declare export type CalendarAuthorizationStatusEnum =
    | 'denied'
    | 'restricted'
    | 'authorized'
    | 'undetermined'
    ;

  declare export type CalendarAvilabilityEnum =
    | 'notSupported'
    | 'busy'
    | 'free'
    | 'tentative'
    | 'unavailable'
    ;

  declare export type CalendarAlarmProximityEnum =
    | 'enter'
    | 'leave'
    | 'None'
    ;

  declare export type CalendarRecurrenceEnum =
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'daily'
    ;

  declare export type CalendarAlarm = {|
    date: string,
    structuredLocation?: {
      title: string,
      proximity: CalendarAlarmProximityEnum,
      radius: number,
      coords: {
        latitude: number,
        longitude: number,
      },
    },
  |};

  declare export type NewCalendarAlarm = {|
    date: Date | number,
    structuredLocation?: {
      title: string,
      proximity: CalendarAlarmProximityEnum,
      radius: number,
      coords: {
        latitude: number,
        longitude: number,
      },
    },
  |};

  declare export type CalendarInfo = {|
    id: CalendarIdentifier,
    title: string,
    source: string,
    allowsModifications: boolean,
    allowedAvailabilities: Array<CalendarAvilabilityEnum>
  |};

  declare export type CalendarEvent = {|
    id?: string,
    calendar?: CalendarInfo,
    title: string,
    location: string,
    startDate: string,
    endDate: string,
    allDay: boolean,
    notes: string,
    url: string,
    alarms: Array<CalendarAlarm>,
    recurrence: string,
    occurrenceDate: string,
    recurrenceRule: {
      frequency: CalendarRecurrenceEnum,
      interval?: number,
      occurrence?: number,
      endDate?: string,
    },
    availability: CalendarAvilabilityEnum,
  |};

  declare export type NewCalendarEvent = {|
    id?: string,
    calendarId?: string,
    title?: string,
    location?: string,
    startDate?: string,
    endDate?: string,
    allDay?: boolean,
    notes?: string,
    url?: string,
    alarms?: Array<NewCalendarAlarm>,
    recurrence?: string,
    recurrenceRule?: {
      frequency: CalendarRecurrenceEnum,
      interval?: number,
      occurrence?: number,
      endDate?: string,
    },
    availability?: CalendarAvilabilityEnum,
  |};

  declare type commonApi = {
    authorizeEventStore(): Promise<'authorized' | 'denied'>,
    authorizationStatus(): Promise<CalendarAuthorizationStatusEnum>,
    fetchAllEvents(Date, Date, calendars?: Array<CalendarIdentifier>): Promise<Array<CalendarEvent>>,
    findCalendars(): Promise<Array<CalendarInfo>>,
    findEventById(id: string): Promise<CalendarEvent>, // throws if it can't find an event
    saveEvent(string, NewCalendarEvent): Promise<any>,
    removeEvent(id: string): Promise<boolean>,
  };

  declare type iosExports = {
    removeFutureEvents?: () => Promise<any>,
  };

  declare type androidExports = {
    uriForCalendar(): Promise<string>,
    openEventInCalendar?: (id: string) => void,
  };

  declare export default commonApi & (iosExports | androidExports);
}
