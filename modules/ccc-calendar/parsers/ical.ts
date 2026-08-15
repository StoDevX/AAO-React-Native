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

const DEFAULT_EXPANSION_WINDOW_DAYS = 90

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
/// 7.5 microseconds/step in a bare Node script, closer to 15 inside this
/// project's own Jest environment. At the slower rate, this ceiling's worst
/// case is several seconds, not milliseconds. An HOURLY rule running since
/// 2000 needs about 235,500 steps to reach "now" (as of 2026) and
/// comfortably finishes under this ceiling with roughly 27% headroom; a rule
/// dense enough to exceed it (`FREQ=MINUTELY` since 2000 needs roughly 13
/// million) throws instead of silently walking for tens of seconds and
/// returning nothing -- see below. That headroom is a wasting asset: an
/// HOURLY rule's from-2000 step count grows by 8,760 (the hours in a year)
/// every year that passes, the same way the old `MAX_OCCURRENCES_PER_EVENT
/// = 2000` constant this replaced went stale against its own window. On the
/// current numbers this ceiling has about seven years before an
/// honestly-old HOURLY rule starts hitting it too.
const DEFAULT_MAX_ITERATIONS_PER_EVENT = 300_000

interface ExpansionLimits {
	windowDays: number
	maxIterations: number
	maxOccurrences: number
}

/// The window and iteration ceilings are fixed by design (90 days, and the
/// measurement above); `maxOccurrences` is *derived* from `windowDays`
/// rather than being its own independent default, so it can't go stale the
/// way the flat `2000` it replaced did. An HOURLY rule has at most
/// `windowDays * 24` occurrences inside the window, and this leaves 2x
/// headroom above that so an hourly series doesn't lose its final stretch to
/// the cap.
///
/// All three are overridable (only by tests, currently -- `parseIcalEvents`
/// doesn't expose this as public API beyond the default). Exercising the
/// real ceilings requires genuinely reaching them, which is where this
/// parser's few genuinely slow tests come from; overriding them here lets
/// most of that behaviour be tested at a scale that finishes in
/// milliseconds instead.
function resolveLimits(limits?: {
	windowDays?: number
	maxIterations?: number
	maxOccurrences?: number
}): ExpansionLimits {
	let windowDays = limits?.windowDays ?? DEFAULT_EXPANSION_WINDOW_DAYS
	return {
		windowDays,
		maxIterations: limits?.maxIterations ?? DEFAULT_MAX_ITERATIONS_PER_EVENT,
		maxOccurrences: limits?.maxOccurrences ?? windowDays * 24 * 2,
	}
}

/// A dedicated error class for hitting the iteration ceiling, rather than a
/// plain `Error` -- see `parseIcalEvents` for why that distinction matters.
class RecurrenceIterationCeilingError extends Error {}

/// `RecurExpansion` only ever emits `DTSTART` itself as an occurrence when
/// the series has an `RRULE` -- an `RDATE`-only series (RFC 5545 permits
/// this: `RDATE` alone is a valid, if unusual, recurrence mechanism) never
/// gets it, even though RFC 5545 3.8.5.2/3.8.5.3 count `DTSTART` as always
/// being part of the recurrence set. Reproduced directly against ical.js:
/// `DTSTART:20260901T130000Z` plus `RDATE:20260908T130000Z,20260915T130000Z`
/// and no `RRULE` walks to exactly the two `RDATE` values, silently dropping
/// the series' own first occurrence.
function needsInjectedDtstart(component: ICAL.Component): boolean {
	return component.hasProperty('rdate') && !component.hasProperty('rrule')
}

/// Whether `time` is named by one of `component`'s own `EXDATE` values.
/// Only used for the injected-`DTSTART` case above -- everywhere else,
/// `EXDATE` exclusion is `ical.js`'s own job (via `RecurExpansion`). Compares
/// by resolved instant rather than replicating `RecurExpansion`'s internal
/// DATE-vs-DATE-TIME truncation, since the case this exists for (an `EXDATE`
/// naming the literal `DTSTART` of an `RDATE`-only series) is narrow enough
/// that an exact-instant match covers what a real feed would actually do.
function isExcludedByExdate(component: ICAL.Component, time: ICAL.Time): boolean {
	let instant = toInstant(time).getTime()
	return component
		.getAllProperties('exdate')
		.some((property) =>
			property.getValues().some((value) => toInstant(value as ICAL.Time).getTime() === instant),
		)
}

/// Walks `event`'s occurrences (a single one, if it doesn't recur) from its
/// `DTSTART` up to `now + windowDays`, applying any `RECURRENCE-ID` overrides
/// and honouring `EXDATE` along the way -- both are handled by `ical.js`
/// itself, via the exceptions passed into the `Event` constructor and the
/// component's own `EXDATE` properties, respectively.
///
/// The walk keeps going past `windowEnd` as long as some override's own
/// (un-overridden) `RECURRENCE-ID` position hasn't been reached yet -- an
/// override can move an occurrence's actual start either out of the window
/// (to reschedule it to next year, say) or *into* it from beyond it (to pull
/// a far-future occurrence forward), and only the iterator's own walk to
/// that `RECURRENCE-ID` position can discover which. Once the walk is both
/// past `windowEnd` and past every known override's `RECURRENCE-ID`, nothing
/// further can still land in the window, and it's safe to stop.
///
/// `toWireEvent` (HTML-stripping the description, scanning it for links) is
/// the expensive part of processing an occurrence, so the today-or-later
/// check runs on the raw `Time` values *before* it's called, not after --
/// otherwise every already-past occurrence on the way to "now" pays that
/// cost only to be thrown away by `parseIcalEvents`'s own future-only filter
/// moments later.
function expandOccurrences(event: ICAL.Event, now: Date, limits: ExpansionLimits): WireEvent[] {
	if (!event.isRecurring()) {
		return [toWireEvent(event, event.startDate, event.endDate, now)]
	}

	let windowEnd = addDays(now, limits.windowDays)
	let endOfToday = endOfDay(now)
	let iterator = event.iterator()
	let occurrences: WireEvent[] = []

	/// Resolves `occurrenceTime` to its (possibly overridden) details and
	/// pushes it if it belongs in the window. Returns whether the
	/// `maxOccurrences` cap was just reached, so callers know to stop.
	function tryPush(occurrenceTime: ICAL.Time): boolean {
		let details = event.getOccurrenceDetails(occurrenceTime)
		if (isAfter(toInstant(details.startDate), windowEnd)) return false
		if (!isAfter(toInstant(details.endDate), endOfToday)) return false

		occurrences.push(toWireEvent(details.item, details.startDate, details.endDate, now))
		return occurrences.length >= limits.maxOccurrences
	}

	if (needsInjectedDtstart(event.component)) {
		let dtstart = event.startDate
		if (!isAfter(toInstant(dtstart), windowEnd) && !isExcludedByExdate(event.component, dtstart)) {
			if (tryPush(dtstart)) return occurrences
		}
	}

	// `Event#exceptions` is typed as `Event[]` but is actually keyed by
	// occurrence-id string internally (`ical.js`'s own JSDoc-derived .d.ts is
	// wrong here) -- `Object.values` reads correctly either way.
	let overrideRecurrenceInstants = Object.values(event.exceptions).map((exception) =>
		toInstant(exception.recurrenceId),
	)
	let latestOverrideInstant =
		overrideRecurrenceInstants.length > 0
			? new Date(Math.max(...overrideRecurrenceInstants.map((instant) => instant.getTime())))
			: null

	for (let iterations = 0; ; iterations += 1) {
		let occurrence = iterator.next()
		if (!occurrence) break

		if (iterations >= limits.maxIterations) {
			// Hitting this should not look like a legitimately empty or
			// partial calendar -- it means the walk gave up, not that the
			// series has nothing upcoming. Throwing routes it through
			// `parseIcalEvents`'s existing per-event failure handling: this
			// event drops out (its siblings are unaffected), or, if every
			// event in the calendar hits it, the all-malformed guard throws
			// visibly instead of silently rendering blank. Checked only once
			// an occurrence has actually been produced -- not before calling
			// `iterator.next()` -- so a finite rule whose last occurrence
			// lands exactly on the ceiling still completes normally instead
			// of throwing on the walk's final, otherwise-unremarkable step.
			throw new RecurrenceIterationCeilingError(
				`ical event exceeded ${limits.maxIterations} recurrence iterations without reaching the expansion window`,
			)
		}

		let occurrenceInstant = toInstant(occurrence)
		let pastWindow = isAfter(occurrenceInstant, windowEnd)
		let pastEveryOverride =
			!latestOverrideInstant || isAfter(occurrenceInstant, latestOverrideInstant)
		if (pastWindow && pastEveryOverride) break

		if (tryPush(occurrence)) break
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
/// legitimately produce zero occurrences inside the window (its next
/// occurrence is further out, say), and that must not be conflated with a
/// conversion failure. So: a non-empty calendar that fails to convert *any*
/// master must throw rather than render a silently blank calendar, but a
/// non-empty calendar whose every event's occurrences all land outside the
/// window (or in the past, once the future-only filter below runs) is a
/// legitimate "nothing to show" and stays empty. A calendar with no masters
/// at all is likewise a legitimate "no events."
///
/// A master that hits the iteration ceiling is dropped the same way any
/// other malformed master is -- its siblings are unaffected, whether it
/// throws `RecurrenceIterationCeilingError` or fails for some ordinary
/// reason (a missing `DTSTART`, say). But when *every* master fails and the
/// guard above throws, the generic "every ical event was malformed" message
/// alone would send a debugging developer straight past the actual cause.
/// The most recently caught error -- ceiling or otherwise -- is attached as
/// `cause`, so it's still there to be found rather than swallowed entirely.
///
/// `limits` overrides the window/iteration/occurrence ceilings `expandOccurrences`
/// enforces; only meant for tests that need to reach a ceiling without the
/// real-world scale that would otherwise take, not for production callers.
export function parseIcalEvents(
	body: unknown,
	now = new Date(),
	limits?: {windowDays?: number; maxIterations?: number; maxOccurrences?: number},
): WireEvent[] {
	let resolvedLimits = resolveLimits(limits)
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
	let lastError: unknown
	let events = masters.flatMap((vevent) => {
		try {
			let overrides = overridesByUid.get(uidOf(vevent) ?? '') ?? []
			let event = new ICAL.Event(vevent, {
				exceptions: overrides.map((override) => new ICAL.Event(override)),
				strictExceptions: true,
			})
			let occurrences = expandOccurrences(event, now, resolvedLimits)
			successCount += 1
			return occurrences
		} catch (error) {
			lastError = error
			return []
		}
	})

	if (masters.length > 0 && successCount === 0) {
		throw new Error('every ical event was malformed', {cause: lastError})
	}

	let endOfToday = endOfDay(now)
	let future = events.filter((event) => isAfter(new Date(event.endTime), endOfToday))

	return future.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
}
