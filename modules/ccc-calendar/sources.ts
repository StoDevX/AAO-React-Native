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

import type {SourceCampus} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'

/** A calendar, and the campus whose calendar screen offers it. */
type CampusSource = CalendarSource & {campus: SourceCampus}

const LIVE_SOURCES: CampusSource[] = [
	{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue, campus: 'stolaf'},
	{id: 'presence', title: 'Presence', color: c.systemIndigo, campus: 'stolaf'},
	{id: 'carleton', title: 'Carleton', color: c.systemBlue, campus: 'carleton'},
]

/**
 * Every calendar the app reads, on either campus. Their colours are ours to
 * pick. The order is the dedupe order `sourceRankOf` reads, so a source's
 * place here decides which copy of a duplicated event survives.
 *
 * UI test mode replaces live sources with a fixture calendar so tests don't
 * depend on network data.
 */
export const REMOTE_SOURCES: CalendarSource[] = isUITesting
	? [{id: 'uitest', title: 'UI Test Fixtures', color: c.systemBlue}]
	: LIVE_SOURCES.map(({campus: _campus, ...source}) => source)

/**
 * The calendars `campus`'s calendar screen offers. St. Olaf's has its own and
 * Presence; Carleton's has Carleton's. UI test mode offers the fixture alone.
 */
export function remoteSourcesFor(campus: SourceCampus): CalendarSource[] {
	if (isUITesting) return REMOTE_SOURCES
	let ids = new Set(LIVE_SOURCES.filter((source) => source.campus === campus).map((s) => s.id))
	return REMOTE_SOURCES.filter((source) => ids.has(source.id))
}
