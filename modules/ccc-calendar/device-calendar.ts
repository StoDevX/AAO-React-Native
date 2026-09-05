import * as Calendar from 'expo-calendar'
import moment from 'moment-timezone'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

/**
 * iOS 17 split EventKit's calendar permission into write-only and full
 * access. Both this module and `add-to-device-calendar` need the full one --
 * reading the device's events here, reading the default calendar there -- so
 * these wrappers exist to name that ask rather than to narrow it.
 */
export function requestFullCalendarAccess(): Promise<Calendar.PermissionResponse> {
	return Calendar.requestCalendarPermissions(false)
}

export function getFullCalendarAccess(): Promise<Calendar.PermissionResponse> {
	return Calendar.getCalendarPermissions(false)
}

/**
 * A device event carries a calendar id rather than a source name, and the
 * colour a merged list would tint it with comes from the calendar, not the
 * event -- so the id is kept alongside the converted event.
 */
export type DeviceEvent = {
	calendarId: string
	id: string
	event: EventType
}

/**
 * The fields of an EventKit event that an `EventType` is built from.
 * `Calendar.ExpoCalendarEvent` is a class, so naming the fields is what lets a
 * plain object stand in for one.
 */
export type DeviceEventFields = Pick<
	Calendar.ExpoCalendarEvent,
	'title' | 'location' | 'notes' | 'url' | 'startDate' | 'endDate' | 'allDay'
>

/**
 * `EventType.config` describes which of an event's edges are meaningful.
 * EventKit says so directly with `allDay`, where the web calendars have to
 * infer it from a 24-hour duration.
 */
export function toEventType(event: DeviceEventFields): EventType {
	let startTime = moment(event.startDate)
	let endTime = moment(event.endDate)
	let {isMultiDay, isSameInstant} = deriveDayFlags(
		event.allDay,
		startTime.toDate(),
		endTime.toDate(),
	)

	return {
		title: event.title,
		description: event.notes ?? '',
		location: event.location ?? '',
		startTime,
		endTime,
		isAllDay: event.allDay,
		isMultiDay,
		isSameInstant,
		isOngoing: false,
		links: event.url ? [event.url] : [],
		categories: [],
		config: {
			startTime: !event.allDay,
			endTime: !event.allDay,
			subtitle: 'location',
		},
	}
}

/**
 * Reads a window rather than the whole device calendar: EventKit will happily
 * return years of events, and the list renders a section per day with no
 * pagination behind it.
 *
 * `calendarIds`, when given, narrows the sweep to those calendars rather
 * than reading every calendar on the device and discarding the rest --
 * `deviceCalendarOptions` asks for one calendar at a time, and N enabled
 * device calendars would otherwise mean N full-device sweeps.
 */
export async function listDeviceEvents(
	start: Date,
	end: Date,
	calendarIds?: string[],
): Promise<DeviceEvent[]> {
	let calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT)
	if (calendarIds) {
		calendars = calendars.filter((calendar) => calendarIds.includes(calendar.id))
	}
	if (calendars.length === 0) {
		return []
	}

	let events = await Calendar.listEvents(calendars, start, end)

	return events.map((event) => ({
		calendarId: event.calendarId,
		id: event.id,
		event: toEventType(event),
	}))
}
