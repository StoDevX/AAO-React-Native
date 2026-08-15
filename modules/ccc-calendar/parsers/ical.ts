import {fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {addDays, endOfDay, isAfter, isBefore, startOfDay} from 'date-fns'
import ICAL from 'ical.js'
import {z} from 'zod'
import type {WireEvent} from './tec-events'

/// RFC 5545 `DESCRIPTION` is plain text, not HTML, so a bare URL sitting in
/// the text (no `<a href>` around it) is invisible to `htmlToSegments`. This
/// catches those too, so a description like "Tickets at https://..." still
/// produces a link.
const BARE_URL_PATTERN = /https?:\/\/[^\s<>"']+/gu

/// A bare URL has no delimiter marking where it ends, so this regex has to
/// treat ordinary sentence punctuation right after it (a period closing the
/// sentence, a comma) as part of the match. Trimming it back off here keeps
/// "https://stolaf.edu/a." from becoming a dead link.
///
/// A trailing `)` needs its own rule rather than the same blanket strip: a
/// URL can legitimately end in one, e.g. Wikipedia's
/// "https://en.wikipedia.org/wiki/Foo_(bar)" or a query string like
/// "?x=(2)". The usual autolinker heuristic -- keep a trailing `)` if the
/// parentheses within the match are balanced, strip it (and re-check) if
/// they are not -- tells those apart from a `)` that's actually closing a
/// surrounding sentence, as in "(https://stolaf.edu/b)".
function stripTrailingPunctuation(url: string): string {
	let trimmed = url.replace(/[.,;:!?\]]+$/u, '')

	while (trimmed.endsWith(')')) {
		let opens = trimmed.match(/\(/gu)?.length ?? 0
		let closes = trimmed.match(/\)/gu)?.length ?? 0
		if (closes <= opens) break
		trimmed = trimmed.slice(0, -1)
	}

	return trimmed
}

function linksIn(descriptionHtml: string): string[] {
	let anchorLinks = htmlToSegments(descriptionHtml).flatMap((segment) =>
		segment.type === 'link' ? [segment.url] : [],
	)
	let bareLinks = (descriptionHtml.match(BARE_URL_PATTERN) ?? []).map(stripTrailingPunctuation)
	return [...new Set([...anchorLinks, ...bareLinks])]
}

/// `Time#toJSDate()` resolves a zoned time (one with a `TZID`, backed by the
/// calendar's embedded `VTIMEZONE`) to the correct instant regardless of the
/// host's own time zone. But for an all-day (`VALUE=DATE`) time it is
/// floating by definition, so `toJSDate()` resolves it against the *host's*
/// local midnight -- correct on a UTC host, wrong (and host-dependent)
/// everywhere else. All-day times are built from their calendar-date fields
/// directly, as UTC midnight, so they stay host-independent.
function toInstant(time: ICAL.Time): Date {
	if (time.isDate) {
		return new Date(Date.UTC(time.year, time.month - 1, time.day))
	}
	return time.toJSDate()
}

function toWireEvent(
	item: ICAL.Event,
	startTime: ICAL.Time,
	endTime: ICAL.Time,
	now: Date,
): WireEvent {
	let startIso = toInstant(startTime).toISOString()
	let endIso = toInstant(endTime).toISOString()
	let descriptionHtml = item.description ?? ''

	return {
		dataSource: 'ical',
		startTime: startIso,
		endTime: endIso,
		title: item.summary ?? '',
		description: fastGetTrimmedText(descriptionHtml),
		location: item.location ?? '',
		isOngoing: isBefore(new Date(startIso), startOfDay(now)),
		links: linksIn(descriptionHtml),
		config: {
			startTime: true,
			endTime: true,
			subtitle: 'location',
		},
	}
}

const EXPANSION_WINDOW_DAYS = 90

/// A ceiling on how many times a single event's iterator gets stepped
/// forward from its true `DTSTART`. `RecurExpansion` has no way to skip
/// ahead to a date near "now" -- re-seeding it closer to "now" would change
/// which weekday/month an implicit (no explicit `BYDAY`) weekly or monthly
/// rule lands on -- so a series that has been running for years still has to
/// be walked one occurrence at a time before the date check below ever gets
/// a chance to stop it.
///
/// This does NOT guarantee "decades of history walk for free" -- it
/// guarantees a bounded wall-clock cost for a single event's walk, and nothing
/// more. Measured directly (stepping `iterator.next()` plus
/// `getOccurrenceDetails()` and `toJSDate()` per step -- the actual
/// per-iteration cost below, not the cheaper raw-`next()`-only case): roughly
/// 7.5 microseconds/step on one machine, 14 on another. At the slower rate,
/// this ceiling's worst case is several seconds, not milliseconds. An HOURLY
/// rule running since 2000 needs about 235,000 steps to reach "now" and
/// comfortably finishes under this ceiling; a rule dense enough to exceed it
/// (`FREQ=MINUTELY` since 2000 needs roughly 13 million) throws instead of
/// silently walking for tens of seconds and returning nothing -- see below.
const MAX_ITERATIONS_PER_EVENT = 300_000

/// A separate ceiling on how many occurrences a single event may contribute
/// to the result -- counting only occurrences that are actually still ahead
/// (or today), the same set `parseIcalEvents`'s own future-only filter keeps.
/// A long-running daily series has thousands of occurrences inside the raw
/// walk above but only ever a handful still ahead of "now"; only counting
/// those means the cap is spent on a rule dense enough to produce thousands
/// of *upcoming* occurrences within the 90-day window itself, not on however
/// much history the series happens to carry.
///
/// Derived from the window length rather than a bare number, so it can't go
/// stale if `EXPANSION_WINDOW_DAYS` ever changes: an HOURLY rule has at most
/// `EXPANSION_WINDOW_DAYS * 24` occurrences inside the window (2160, for 90
/// days), and this leaves 2x headroom above that so an hourly series doesn't
/// lose its final stretch to the cap the way a bare `2000` (less than 2160)
/// did.
const MAX_OCCURRENCES_PER_EVENT = EXPANSION_WINDOW_DAYS * 24 * 2

/// Walks `event`'s occurrences (a single one, if it doesn't recur) from its
/// `DTSTART` up to `now + 90 days`, applying any `RECURRENCE-ID` overrides
/// and honouring `EXDATE` along the way -- both are handled by `ical.js`
/// itself, via the exceptions passed into the `Event` constructor and the
/// component's own `EXDATE` properties, respectively.
///
/// The walk is bounded by the iterator's own (un-overridden) occurrence
/// time, not by the possibly-overridden `details.startDate` -- those answer
/// two different questions. The iterator's position is what tells us we've
/// walked the whole series past the window and can stop entirely; a single
/// `RECURRENCE-ID` override moving *this* occurrence's actual start outside
/// the window (to reschedule it to next year, say) says nothing about where
/// its still-on-schedule siblings fall, so that occurrence alone is left out
/// rather than treated as the end of the series. (The mirror case -- an
/// override moving an occurrence *into* the window from beyond it -- is not
/// handled: the walk has already stopped by the time that occurrence's own
/// position would be reached. Not expected to come up in practice; noted
/// rather than fixed.)
///
/// `toWireEvent` (HTML-stripping the description, scanning it for links) is
/// the expensive part of processing an occurrence, so the today-or-later
/// check runs on the raw `Time` values *before* it's called, not after --
/// otherwise every already-past occurrence on the way to "now" pays that
/// cost only to be thrown away by `parseIcalEvents`'s own future-only filter
/// moments later.
function expandOccurrences(event: ICAL.Event, now: Date): WireEvent[] {
	if (!event.isRecurring()) {
		return [toWireEvent(event, event.startDate, event.endDate, now)]
	}

	let windowEnd = addDays(now, EXPANSION_WINDOW_DAYS)
	let endOfToday = endOfDay(now)
	let iterator = event.iterator()
	let occurrences: WireEvent[] = []

	for (let iterations = 0; ; iterations += 1) {
		if (iterations >= MAX_ITERATIONS_PER_EVENT) {
			// Hitting this should not look like a legitimately empty or
			// partial calendar -- it means the walk gave up, not that the
			// series has nothing upcoming. Throwing routes it through
			// `parseIcalEvents`'s existing per-event failure handling: this
			// event drops out (its siblings are unaffected), or, if every
			// event in the calendar hits it, the all-malformed guard throws
			// visibly instead of silently rendering blank.
			throw new Error(
				`ical event exceeded ${MAX_ITERATIONS_PER_EVENT} recurrence iterations without reaching the expansion window`,
			)
		}

		let occurrence = iterator.next()
		if (!occurrence) break
		if (isAfter(toInstant(occurrence), windowEnd)) break

		let details = event.getOccurrenceDetails(occurrence)
		if (isAfter(toInstant(details.startDate), windowEnd)) continue
		if (!isAfter(toInstant(details.endDate), endOfToday)) continue

		occurrences.push(toWireEvent(details.item, details.startDate, details.endDate, now))
		if (occurrences.length >= MAX_OCCURRENCES_PER_EVENT) break
	}

	return occurrences
}

function uidOf(component: ICAL.Component): string | undefined {
	let uid = component.getFirstPropertyValue('uid')
	return typeof uid === 'string' && uid ? uid : undefined
}

/// The outer shape stays strict: a body that isn't a string at all, or isn't
/// parseable iCalendar, means the source is wrong, and that should throw.
/// Each master `VEVENT` (one without its own `RECURRENCE-ID` -- i.e. not
/// itself an override) is then converted on its own, so one event this feed
/// can't fully describe (a missing `DTSTART`, for instance) doesn't blank
/// the rest of the calendar. `RECURRENCE-ID` overrides are matched to their
/// master by `UID` and passed in explicitly, rather than relying on
/// `ical.js`'s own automatic matching, which does not consider `UID` at all
/// and would relate every override in the calendar to every master.
///
/// A master's success is tracked independently of how many (if any)
/// occurrences it produced -- a valid, non-malformed recurring event can
/// legitimately produce zero occurrences inside the 90-day window (its next
/// occurrence is further out, say), and that must not be conflated with a
/// conversion failure. So: a non-empty calendar that fails to convert *any*
/// master must throw rather than render a silently blank calendar, but a
/// non-empty calendar whose every event's occurrences all land outside the
/// window (or in the past, once the future-only filter below runs) is a
/// legitimate "nothing to show" and stays empty. A calendar with no masters
/// at all is likewise a legitimate "no events."
export function parseIcalEvents(body: unknown, now = new Date()): WireEvent[] {
	let text = z.string().parse(body)
	let calendar = ICAL.Component.fromString(text)
	let vevents = calendar.getAllSubcomponents('vevent')

	let masters = vevents.filter((vevent) => !vevent.hasProperty('recurrence-id'))

	let overridesByUid = new Map<string, ICAL.Component[]>()
	for (let vevent of vevents) {
		if (!vevent.hasProperty('recurrence-id')) continue
		let uid = uidOf(vevent)
		if (!uid) continue
		overridesByUid.set(uid, [...(overridesByUid.get(uid) ?? []), vevent])
	}

	let successCount = 0
	let events = masters.flatMap((vevent) => {
		try {
			let overrides = overridesByUid.get(uidOf(vevent) ?? '') ?? []
			let event = new ICAL.Event(vevent, {
				exceptions: overrides.map((override) => new ICAL.Event(override)),
				strictExceptions: true,
			})
			let occurrences = expandOccurrences(event, now)
			successCount += 1
			return occurrences
		} catch {
			return []
		}
	})

	if (masters.length > 0 && successCount === 0) {
		throw new Error('every ical event was malformed')
	}

	let endOfToday = endOfDay(now)
	let future = events.filter((event) => isAfter(new Date(event.endTime), endOfToday))

	return future.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
}
