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

/**
 * Every calendar the app reads, on any campus, by its id in the sources
 * manifest. Which of them a campus's calendar screen offers is the campus's
 * to say; the app passes those ids to `remoteSourcesFor`. Their colours are
 * ours to pick. The order is the dedupe order `sourceRankOf` reads, so a
 * source's place here decides which copy of a duplicated event survives.
 */
export const REMOTE_SOURCES: CalendarSource[] = [
	{id: 'stolaf', title: 'St. Olaf', color: c.systemBlue},
	{id: 'presence', title: 'Presence', color: c.systemIndigo},
	{id: 'carleton', title: 'Carleton', color: c.systemBlue},
	{id: 'wiki-monkeys', title: 'Wiki Monkeys', color: c.systemTeal},
]

/**
 * The calendars a calendar screen offers, from the source ids its campus
 * names, in dedupe order. An id naming no calendar is skipped.
 */
export function remoteSourcesFor(sourceIds: readonly string[]): CalendarSource[] {
	return REMOTE_SOURCES.filter((source) => sourceIds.includes(source.id))
}
