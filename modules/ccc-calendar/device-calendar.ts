import * as Calendar from 'expo-calendar'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

/// iOS 17 split EventKit's calendar permission into write-only and full
/// access. `add-to-device-calendar` only ever needs to write, so it asks for
/// the narrower one; reading the device's events needs this.
export function requestFullCalendarAccess(): Promise<Calendar.PermissionResponse> {
	return Calendar.requestCalendarPermissions(false)
}

export function getFullCalendarAccess(): Promise<Calendar.PermissionResponse> {
	return Calendar.getCalendarPermissions(false)
}

/// A device event carries a calendar id rather than a source name, and the
/// colour a merged list would tint it with comes from the calendar, not the
/// event -- so the id is kept alongside the converted event.
export type DeviceEvent = {
	calendarId: string
	event: EventType
}

/// `EventType.config` describes which of an event's edges are meaningful.
/// EventKit says so directly with `allDay`, where the web calendars have to
/// infer it from a 24-hour duration.
function toEventType(event: Calendar.ExpoCalendarEvent): EventType {
	let startTime = moment(event.startDate)
	let endTime = moment(event.endDate)

	return {
		title: event.title,
		description: event.notes ?? '',
		location: event.location ?? '',
		startTime,
		endTime,
		isOngoing: false,
		links: event.url ? [event.url] : [],
		config: {
			startTime: !event.allDay,
			endTime: !event.allDay,
			subtitle: 'location',
		},
	}
}

/// Reads a window rather than the whole device calendar: EventKit will happily
/// return years of events, and the list renders a section per day with no
/// pagination behind it.
export async function listDeviceEvents(start: Date, end: Date): Promise<DeviceEvent[]> {
	let calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT)
	if (calendars.length === 0) {
		return []
	}

	let events = await Calendar.listEvents(calendars, start, end)

	return events.map((event) => ({
		calendarId: event.calendarId,
		event: toEventType(event),
	}))
}
