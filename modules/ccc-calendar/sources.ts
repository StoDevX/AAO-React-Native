import * as c from '@frogpond/colors'
import type {CalendarSource, SourcedEvent} from '@frogpond/event-list'

/**
 * `SourcedEvent` (an event tagged with the calendar it came from) and
 * `CalendarSource` (what the picker lists and the row tint reads) are
 * event-list's types --
 * event-list is the lower, reusable layer, so it owns the definitions, and
 * this module re-exports them rather than keeping a second, structurally-
 * duplicated copy that could silently drift.
 */
export type {CalendarSource, SourcedEvent}

import {isUITesting} from '@frogpond/launch-arguments'

/**
 * The app's calendars. Their colours are ours to pick.
 *
 * UI test mode replaces live sources with a fixture calendar so tests don't
 * depend on network data.
 */
export const REMOTE_SOURCES: CalendarSource[] = isUITesting
	? [{id: 'uitest', title: 'UI Test Fixtures', color: c.systemBlue}]
	: [
			{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue},
			{id: 'presence', title: 'Presence', color: c.systemIndigo},
		]
