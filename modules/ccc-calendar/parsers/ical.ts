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
/// sentence, a comma, a closing paren wrapping a parenthetical link) as part
/// of the match. Trimming it back off here keeps "https://stolaf.edu/a." and
/// "https://stolaf.edu/b)" from becoming dead links.
function stripTrailingPunctuation(url: string): string {
	return url.replace(/[.,;:!?)\]]+$/u, '')
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
/// a chance to stop it. This does NOT bound "years of history"; it bounds
/// raw iterator steps, and is sized off a direct measurement rather than an
/// estimate: an HOURLY rule running since 2000 (roughly 230,000 occurrences)
/// takes about 50ms to walk with ical.js on this parser's own benchmark, so
/// this ceiling sits comfortably above that with headroom, not below it.
const MAX_ITERATIONS_PER_EVENT = 1_000_000

/// A separate ceiling on how many occurrences a single event may contribute
/// to the result -- counting only occurrences that are actually still ahead
/// (or today), the same set `parseIcalEvents`'s own future-only filter keeps.
/// A long-running daily series has thousands of occurrences inside the raw
/// walk above but only ever a handful still ahead of "now"; only counting
/// those means the cap is spent on a rule dense enough to produce thousands
/// of *upcoming* occurrences within the 90-day window itself (`MINUTELY`,
/// say), not on however much history the series happens to carry.
const MAX_OCCURRENCES_PER_EVENT = 2000

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
/// rather than treated as the end of the series.
function expandOccurrences(event: ICAL.Event, now: Date): WireEvent[] {
	if (!event.isRecurring()) {
		return [toWireEvent(event, event.startDate, event.endDate, now)]
	}

	let windowEnd = addDays(now, EXPANSION_WINDOW_DAYS)
	let endOfToday = endOfDay(now)
	let iterator = event.iterator()
	let occurrences: WireEvent[] = []

	for (let iterations = 0; iterations < MAX_ITERATIONS_PER_EVENT; iterations += 1) {
		let occurrence = iterator.next()
		if (!occurrence) break
		if (isAfter(toInstant(occurrence), windowEnd)) break

		let details = event.getOccurrenceDetails(occurrence)
		if (isAfter(toInstant(details.startDate), windowEnd)) continue

		let wireEvent = toWireEvent(details.item, details.startDate, details.endDate, now)

		// Skip (without counting against the per-event cap below) any
		// occurrence that's already over. `parseIcalEvents` re-applies this
		// same future-only check across every event once expansion is done;
		// doing it here too means a long-running daily/weekly series doesn't
		// spend its entire cap on decades of irrelevant history before ever
		// reaching the handful of occurrences near "now" that matter.
		if (!isAfter(new Date(wireEvent.endTime), endOfToday)) continue

		occurrences.push(wireEvent)
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
