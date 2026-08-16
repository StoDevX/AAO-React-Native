import type {ColorValue} from 'react-native'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'

/// An event, and which calendar it came from. Declared here rather than beside
/// the merge because both `query.ts` and `use-merged-events.ts` need it, and
/// this module is the leaf they already share -- putting it with the merge
/// would make those two import each other.
export type SourcedEvent = {
	sourceId: string
	key: string
	event: EventType
}

/// Anything that can contribute events to the calendar. The picker, the merge,
/// and the tint on a row all work from this and do not care which kind it is.
export type CalendarSource = {
	id: string
	title: string
	color: ColorValue
	kind: 'remote' | 'device'
}

/// The app's own calendars. Their colours are ours to pick -- unlike a device
/// calendar, which arrives with one.
export const REMOTE_SOURCES: CalendarSource[] = [
	{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue, kind: 'remote'},
	{id: 'northfield', title: 'Northfield', color: c.systemIndigo, kind: 'remote'},
]

const DEVICE_PREFIX = 'device:'

export function deviceSourceId(calendarId: string): string {
	return `${DEVICE_PREFIX}${calendarId}`
}

export function isDeviceSourceId(id: string): boolean {
	return id.startsWith(DEVICE_PREFIX)
}

export function deviceCalendarIdFrom(sourceId: string): string {
	return sourceId.slice(DEVICE_PREFIX.length)
}

export function toDeviceSource(calendar: {
	id: string
	title: string
	color?: string
}): CalendarSource {
	return {
		id: deviceSourceId(calendar.id),
		title: calendar.title,
		color: calendar.color ?? c.systemGray,
		kind: 'device',
	}
}
