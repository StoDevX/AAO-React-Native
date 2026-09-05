import * as c from '@frogpond/colors'
import type {CalendarSource, SourcedEvent} from '@frogpond/event-list'

/**
 * `SourcedEvent` (an event tagged with the calendar it came from) and
 * `CalendarSource` (the picker, the merge, and the row tint all work from
 * this, and do not care which kind it is) are event-list's types --
 * event-list is the lower, reusable layer, so it owns the definitions, and
 * this module re-exports them rather than keeping a second, structurally-
 * duplicated copy that could silently drift.
 */
export type {CalendarSource, SourcedEvent}

import {isUITesting} from '@frogpond/launch-arguments'

/**
 * The app's own calendars. Their colours are ours to pick -- unlike a device
 * calendar, which arrives with one.
 *
 * UI test mode replaces live sources with a fixture calendar so tests don't
 * depend on network data.
 */
export const REMOTE_SOURCES: CalendarSource[] = isUITesting
	? [{id: 'uitest', title: 'UI Test Fixtures', color: c.systemBlue, kind: 'remote'}]
	: [{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue, kind: 'remote'}]

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
