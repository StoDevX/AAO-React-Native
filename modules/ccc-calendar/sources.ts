import * as c from '@frogpond/colors'
import type {CalendarSource, SourcedEvent} from '@frogpond/event-list'
import {servesBundledFixtures} from '@frogpond/launch-arguments'

/**
 * `SourcedEvent` (an event tagged with the calendar it came from) and
 * `CalendarSource` (what the picker lists and the row tint reads) are
 * event-list's types --
 * event-list is the lower, reusable layer, so it owns the definitions, and
 * this module re-exports them rather than keeping a second, structurally-
 * duplicated copy that could silently drift.
 */
export type {CalendarSource, SourcedEvent}

/**
 * Every calendar the app reads, by its id in the sources manifest. Which of
 * them a campus's calendar screen offers is the campus's to say; the app
 * passes those ids to `remoteSourcesFor`.
 */
const LIVE_SOURCES: CalendarSource[] = [
	{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue},
	{id: 'presence', title: 'Presence', color: c.systemIndigo},
	{id: 'carleton', title: 'Carleton', color: c.systemBlue},
]

/**
 * Every calendar the app reads, on any campus. Their colours are ours to
 * pick. The order is the dedupe order `sourceRankOf` reads, so a source's
 * place here decides which copy of a duplicated event survives.
 *
 * UI test mode, naming no campus, replaces live sources with a fixture calendar so tests don't
 * depend on network data.
 */
export const REMOTE_SOURCES: CalendarSource[] = servesBundledFixtures
	? [{id: 'uitest', title: 'UI Test Fixtures', color: c.systemBlue}]
	: LIVE_SOURCES

/**
 * The calendars a calendar screen offers, from the source ids its campus
 * names, in dedupe order. An id naming no calendar is skipped. UI test mode,
 * naming no campus, offers the fixture alone.
 */
export function remoteSourcesFor(sourceIds: readonly string[]): CalendarSource[] {
	// A UI test's one calendar stands in for a campus's own, and a campus that
	// names none still has none.
	if (servesBundledFixtures) return sourceIds.length > 0 ? REMOTE_SOURCES : []
	return REMOTE_SOURCES.filter((source) => sourceIds.includes(source.id))
}
