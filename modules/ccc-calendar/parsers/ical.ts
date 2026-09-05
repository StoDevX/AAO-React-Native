import {deriveDayFlags} from '@frogpond/event-type'
import {decode, htmlToSegments} from '@frogpond/html-lib'
import {addDays, endOfDay, isAfter, isBefore, startOfDay} from 'date-fns'
import ICAL from 'ical.js'
import {z} from 'zod'
import type {WireEvent} from './events'

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

/// RFC 5545 `DESCRIPTION` is plain text, not HTML (see the module comment
/// above). Running it through an HTML tag-stripping parser reads any
/// angle-bracketed text in it as markup and discards it -- an email address
/// written `<alice@x.edu>`, or a bare URL in its RFC 3986 delimiter form
/// `<https://...>`, both vanish silently, along with anything else that
/// happens to parse as a tag. The correct plain-text treatment is to decode
/// character entities (a producer can still legally write `&amp;`) and
/// normalise whitespace, without touching angle brackets at all.
///
/// A producer that puts real markup in `DESCRIPTION` anyway -- against the
/// spec, but seen in practice -- will now have that markup show up literally
/// rather than be silently stripped. Sniffing the text to decide whether it
/// "looks like" real markup before choosing how to treat it was considered
/// and rejected: it's exactly the kind of heuristic this file's own history
/// (seven review rounds, each finding a "plausible-looking wrong calendar"
/// bug) argues against. `linksIn`, just above, still finds an anchor's
/// `href` when one is actually present, so a link embedded in real markup is
/// not lost -- only the field's own tag-stripping is removed.
function plainTextDescription(description: string): string {
	return decode(description).replace(/\s+/gu, ' ').trim()
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

/// `RDATE` (unlike every other date-valued property this parser touches) is
/// allowed a `VALUE=PERIOD` form -- an explicit (start, duration) pair rather
/// than a single instant. `RecurExpansion` happily mixes `ICAL.Period`
/// values into the same occurrence stream as `ICAL.Time` values (both
/// implement `.compare()`, which is all it needs internally), but every
/// occurrence this parser was written to expect is a `Time` -- `toInstant`,
/// `getOccurrenceDetails`, and everything downstream call `Time`-only
/// methods that don't exist on `Period`. Narrowing at the one place a
/// `Period` can enter the walk (see `expandOccurrences`) turns what would
/// otherwise be an uncaught `TypeError` -- and, via `expandOccurrences`'s own
/// per-master `try`/`catch`, the silent loss of every *other* occurrence that
/// master would have produced -- into just that one occurrence going
/// unsupported.
function isIcalTime(value: ICAL.Time | ICAL.Period): value is ICAL.Time {
	return !(value instanceof ICAL.Period)
}

function toWireEvent(
	item: ICAL.Event,
	startTime: ICAL.Time,
	endTime: ICAL.Time,
	now: Date,
): WireEvent {
	let startJsDate = toInstant(startTime)
	let startIso = startJsDate.toISOString()
	let endJsDate = toInstant(endTime)
	let endIso = endJsDate.toISOString()
	let isAllDay = startTime.isDate && endTime.isDate
	let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startJsDate, endJsDate)
	let descriptionHtml = item.description ?? ''

	return {
		dataSource: 'ical',
		startTime: startIso,
		endTime: endIso,
		isAllDay,
		isMultiDay,
		isSameInstant,
		title: item.summary ?? '',
		description: plainTextDescription(descriptionHtml),
		location: item.location ?? '',
		isOngoing: isBefore(new Date(startIso), startOfDay(now)),
		links: linksIn(descriptionHtml),
		categories: [],
		config: {
			startTime: !(startTime.isDate && endTime.isDate),
			endTime: !(startTime.isDate && endTime.isDate),
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
/// the cap -- and, past that headroom, throws (see
/// `RecurrenceOccurrenceCeilingError`) rather than silently truncating.
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
///
/// Exported (alongside `seekableRule` and `computeSeedTime`) only so
/// `ical-equivalence.test.ts` can assert that a divergence between the
/// parser and its naive reference walk is specifically a ceiling hit --
/// which, for a genuinely dense, uncapped rule (`SECONDLY`, some
/// `MINUTELY`), is correct behaviour on both sides, not a bug -- rather than
/// blanket-swallowing any exception, which would hide a real regression
/// behind an unrelated throw. Not part of the module's public parsing API.
export class RecurrenceIterationCeilingError extends Error {}

/// A dedicated error class for hitting the occurrence ceiling (`maxOccurrences`
/// in `ExpansionLimits`), distinct from `RecurrenceIterationCeilingError`
/// above. Before this existed, hitting `maxOccurrences` didn't throw at all --
/// it just stopped `expandOccurrences`'s walk early and returned whatever had
/// been collected so far, which looks exactly like a legitimately partial (or,
/// for a sparser window, complete) calendar. That is the same "plausible-
/// looking wrong calendar" failure mode `RecurrenceIterationCeilingError`
/// exists to turn loud; giving the occurrence ceiling its own throw, and its
/// own error class, does the same for it, and keeps the two distinguishable
/// from each other (in Sentry, or in a test asserting on `.cause`) rather than
/// collapsing them into one generic "something was capped" error.
export class RecurrenceOccurrenceCeilingError extends Error {}

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

/// Mirrors `RecurExpansion#_compare_special`: a `DATE`-valued `EXDATE`
/// excludes a `DATE-TIME` occurrence that falls on the same calendar day,
/// not only an exact instant match. `ical.js` applies this truncation for
/// every `EXDATE` it evaluates itself (any occurrence the walk below reaches
/// normally); this parser only needs its own copy for the one occurrence
/// `ical.js` never evaluates `EXDATE` against at all -- the injected
/// `DTSTART` of an `RDATE`-only series, below. Without it, that same
/// `EXDATE;VALUE=DATE` would exclude an `RDATE` occurrence on that day but
/// not a `DTSTART` occurrence on that day: two different rules for what
/// should be the same property.
function compareWithDateTruncation(a: ICAL.Time, b: ICAL.Time): number {
	if (!a.isDate && b.isDate) {
		return new ICAL.Time(
			{year: a.year, month: a.month, day: a.day},
			ICAL.Timezone.localTimezone,
		).compare(b)
	}
	return a.compare(b)
}

/// Whether `time` is named by one of `component`'s own `EXDATE` values. Used
/// for the two occurrences below that `ical.js` never itself evaluates
/// `EXDATE` against -- the injected `DTSTART` of an `RDATE`-only series, and
/// a beyond-window override found by its own `RECURRENCE-ID` rather than by
/// the walk reaching it. Everywhere else (any occurrence the walk itself
/// produces), `EXDATE` exclusion is `ical.js`'s own job.
function isExcludedByExdate(component: ICAL.Component, time: ICAL.Time): boolean {
	return component
		.getAllProperties('exdate')
		.some((property) =>
			property
				.getValues()
				.some((value) => compareWithDateTruncation(time, value as ICAL.Time) === 0),
		)
}

/// Whether `time` already appears as one of `component`'s own `RDATE`
/// values. Some producers list `DTSTART` in `RDATE` explicitly, even though
/// RFC 5545 already counts it as part of the recurrence set on its own --
/// without this check, the injected-`DTSTART` case below would duplicate it.
/// A `VALUE=PERIOD` `RDATE` entry can never equal a `DTSTART` this way (its
/// value is a start/duration pair, not an instant `DTSTART` could match), so
/// `isIcalTime` simply excludes those entries rather than needing its own
/// comparison.
function isAlreadyInRdate(component: ICAL.Component, time: ICAL.Time): boolean {
	let instant = toInstant(time).getTime()
	return component
		.getAllProperties('rdate')
		.some((property) =>
			property
				.getValues()
				.some((value) => isIcalTime(value) && toInstant(value).getTime() === instant),
		)
}

/// Frequencies whose recurrence step is a fixed span of time. Unlike MONTHLY
/// and YEARLY -- where the implicit anchor (day-of-month, or Feb 29) can land
/// on a date that doesn't exist in every target period -- stepping any of
/// these by a whole number of periods is exact: it's the same day/hour/
/// minute/second field arithmetic `RecurIterator` itself performs one period
/// at a time (see `computeSeedTime`), just done once instead of N times.
const FIXED_PERIOD_SECONDS: Record<string, number> = {
	SECONDLY: 1,
	MINUTELY: 60,
	HOURLY: 60 * 60,
	DAILY: 24 * 60 * 60,
	WEEKLY: 7 * 24 * 60 * 60,
}

/// How many whole periods of margin to keep a seed behind `now`. Not
/// load-bearing for correctness by itself -- `expandOccurrences`'s walk below
/// still evaluates every candidate from the seed forward exactly as it would
/// from `DTSTART` -- but keeps the seed comfortably clear of `now` even if a
/// rule's own within-period alignment shifts the first post-seed occurrence
/// forward by close to a full period.
const SEED_MARGIN_PERIODS = 2

/// Whether `component`'s `RRULE` can be seeded safely: exactly one rule, on a
/// fixed-period frequency (see `FIXED_PERIOD_SECONDS`), with no `BY*` part
/// beyond a single `BYDAY` -- the ordinary "every Tuesday" shape this
/// parser's real feed is built from (79 WEEKLY rules, one `BYDAY` each).
/// Anything else -- MONTHLY or YEARLY, a multi-day `BYDAY` list, or any other
/// `BY*` part -- falls back to walking unseeded from `DTSTART` below.
///
/// A `COUNT`-limited rule is excluded regardless of shape: `RecurIterator`
/// enforces `COUNT` by counting occurrences from wherever *it* started
/// (`occurrence_number`, incremented from 0 at the first value it returns),
/// not from the true `DTSTART`. Seeding it near `now` would restart that
/// count from the seed instead of from the series' real first occurrence,
/// so a rule whose true occurrences are long exhausted could still produce
/// phantom ones from the seeded position. `UNTIL` has no such problem -- it
/// stops the walk by comparing directly against an absolute time, which
/// holds regardless of where the walk began -- so it's left alone.
///
/// This is deliberately conservative otherwise too: every fix this file has
/// been through was a case of a "should be safe" shortcut turning out not to
/// be for some rule shape the original fix didn't consider. Widening this
/// predicate to accept MONTHLY or YEARLY, in particular, has been checked
/// directly against the equivalence harness and does *not* hold -- both
/// diverge from the reference walk -- so that exclusion is load-bearing, not
/// just cautious.
///
/// Exported (alongside `computeSeedTime`) only so `ical-equivalence.test.ts`
/// can assert its own coverage against the real predicate -- calling this
/// directly rather than keeping a second, hand-maintained copy in the test
/// file that could silently drift from what this function actually does.
/// Not part of the module's public parsing API.
export function seekableRule(component: ICAL.Component): ICAL.Recur | undefined {
	let rrules = component.getAllProperties('rrule')
	if (rrules.length !== 1) return undefined

	let rule = rrules[0].getFirstValue() as ICAL.Recur
	if (rule.count) return undefined
	if (!(rule.freq in FIXED_PERIOD_SECONDS)) return undefined

	let byParts = Object.keys(rule.parts)
	if (rule.freq === 'WEEKLY') {
		if (byParts.some((part) => part !== 'BYDAY')) return undefined
		if ((rule.parts.BYDAY?.length ?? 0) > 1) return undefined
		return rule
	}

	return byParts.length === 0 ? rule : undefined
}

/// Builds a seed time for `event.iterator()` that lands close to (but, minus
/// `SEED_MARGIN_PERIODS`, no later than) `now`, while preserving `DTSTART`'s
/// exact wall-clock time, zone, and weekday/day-of-month alignment.
/// `Time#addDuration` adds directly to the same day/hour/minute/second fields
/// `RecurIterator` itself steps one period at a time, so jumping by N whole
/// periods in a single call produces the identical field state N individual
/// steps would -- DST included, since both are wall-clock field arithmetic,
/// not absolute-instant arithmetic.
///
/// `durationSeconds` -- the event's own `DTEND - DTSTART` (or `RDATE`'s
/// shared duration; every occurrence of one `VEVENT`, `RRULE`- or
/// `RDATE`-produced alike, uses the same span) -- is subtracted from the
/// elapsed time *before* it's floored into periods. Without it, an
/// occurrence that started before the seed but is still ongoing at `now` (a
/// multi-day event, say) would be skipped entirely: the seed becomes both
/// `RecurExpansion`'s own walk position and the start position for the
/// binary search it runs over `RDATE`/`EXDATE`, so anything -- RRULE-stepped
/// or RDATE-listed -- that starts earlier than the seed is never reached,
/// regardless of how long it runs past that point. Pulling the seed back by
/// the occurrence's own duration keeps any occurrence still in progress at
/// `now` on the reachable side of the seed. Caught directly: an unpadded
/// seed against a multi-day-occurrence `DAILY` rule silently dropped every
/// occurrence still running at `now`, the exact case `parseIcalEvents`'s own
/// `isOngoing` and `endTime > endOfToday` handling exist to keep.
///
/// Returns `undefined` when there's nothing to gain -- `DTSTART` is already
/// within a few periods of `now` -- since the unseeded walk from `DTSTART` is
/// already cheap in that case, and skipping the seed avoids any risk of
/// landing it wrong for no benefit.
export function computeSeedTime(
	dtstart: ICAL.Time,
	rule: ICAL.Recur,
	now: Date,
	durationSeconds: number,
): ICAL.Time | undefined {
	let periodSeconds = FIXED_PERIOD_SECONDS[rule.freq] * (rule.interval || 1)
	let elapsedSeconds = (now.getTime() - toInstant(dtstart).getTime()) / 1000 - durationSeconds
	let periodsElapsed = Math.floor(elapsedSeconds / periodSeconds)
	let periodsToJump = periodsElapsed - SEED_MARGIN_PERIODS
	if (periodsToJump <= 0) return undefined

	let seed = dtstart.clone()
	seed.addDuration(ICAL.Duration.fromSeconds(periodsToJump * periodSeconds))

	// `addDuration` deliberately defers normalising day/month/year overflow
	// (its own comment: "we don't actually normalize until we need it"), so a
	// large jump like this one leaves `seed.day` holding a raw, un-normalised
	// count rather than a real calendar day. `RecurIterator.init()` reads
	// that raw field directly to seed its own day/month/year, and its
	// carry-the-overflow-into-the-next-month stepping logic assumes a
	// starting value close to normalised already -- fed a large raw day
	// count instead, it lands a day off. `adjust(0, 0, 0, 0)` is `ICAL.Time`'s
	// own public no-op-offset call that forces exactly this normalisation
	// (confirmed directly against this fixture: without it, a seeded WEEKLY
	// rule landed one day off every occurrence; the equivalence harness
	// caught it immediately).
	seed.adjust(0, 0, 0, 0)
	return seed
}

/// Walks `event`'s occurrences (a single one, if it doesn't recur) from its
/// `DTSTART` up to `now + windowDays`, applying any `RECURRENCE-ID` overrides
/// and honouring `EXDATE` along the way -- both are handled by `ical.js`
/// itself, via the exceptions passed into the `Event` constructor and the
/// component's own `EXDATE` properties, respectively.
///
/// The walk itself is bounded strictly by `windowEnd`, exactly as before
/// overrides were considered at all -- it never runs past it. An override
/// whose own (un-overridden) `RECURRENCE-ID` sits beyond `windowEnd` is
/// handled separately, below, without walking the iterator out to find it:
/// every override is already a fully-built `ICAL.Event` before this function
/// runs, so its own moved-to `startDate` is known up front. Walking the
/// iterator out to an arbitrary `RECURRENCE-ID` to discover the same thing
/// would be unbounded -- a `RECURRENCE-ID` can be any distance in the future
/// -- and, depending on the rule's frequency, can burn through the entire
/// iteration ceiling just covering that distance, discarding every
/// occurrence the event would otherwise have produced along the way.
///
/// `toWireEvent` (HTML-stripping the description, scanning it for links) is
/// the expensive part of processing an occurrence, so the today-or-later
/// check runs on the raw `Time` values *before* it's called, not after --
/// otherwise every already-past occurrence on the way to "now" pays that
/// cost only to be thrown away by `parseIcalEvents`'s own future-only filter
/// moments later.
///
/// For a `seekableRule` shape, the walk starts from a seed near `now`
/// (`computeSeedTime`) instead of the true `DTSTART` -- this is where a
/// years-old daily/weekly series stops paying for every already-past
/// occurrence between `DTSTART` and the window. Every other shape still
/// walks from `DTSTART` unseeded, exactly as before.
function expandOccurrences(event: ICAL.Event, now: Date, limits: ExpansionLimits): WireEvent[] {
	if (!event.isRecurring()) {
		return [toWireEvent(event, event.startDate, event.endDate, now)]
	}

	let windowEnd = addDays(now, limits.windowDays)
	let endOfToday = endOfDay(now)
	let rule = seekableRule(event.component)
	let durationSeconds =
		(toInstant(event.endDate).getTime() - toInstant(event.startDate).getTime()) / 1000
	let seedTime = rule ? computeSeedTime(event.startDate, rule, now, durationSeconds) : undefined
	let iterator = event.iterator(seedTime)
	let occurrences: WireEvent[] = []

	/// Resolves `occurrenceTime` to its (possibly overridden) details and
	/// pushes it if it belongs in the window. Throws
	/// `RecurrenceOccurrenceCeilingError` the moment a push reaches
	/// `maxOccurrences` -- mirroring `maxIterations`, below, hitting this
	/// ceiling must not look like a legitimately partial calendar (see that
	/// error class's own comment).
	function tryPush(occurrenceTime: ICAL.Time): void {
		let details = event.getOccurrenceDetails(occurrenceTime)
		if (isAfter(toInstant(details.startDate), windowEnd)) return
		if (!isAfter(toInstant(details.endDate), endOfToday)) return

		occurrences.push(toWireEvent(details.item, details.startDate, details.endDate, now))
		if (occurrences.length >= limits.maxOccurrences) {
			throw new RecurrenceOccurrenceCeilingError(
				`ical event exceeded ${limits.maxOccurrences} occurrences inside the expansion window`,
			)
		}
	}

	if (needsInjectedDtstart(event.component)) {
		let dtstart = event.startDate
		if (
			!isAlreadyInRdate(event.component, dtstart) &&
			!isExcludedByExdate(event.component, dtstart)
		) {
			tryPush(dtstart)
		}
	}

	// `Event#exceptions` is typed as `Event[]` but is actually keyed by
	// occurrence-id string internally (`ical.js`'s own JSDoc-derived .d.ts is
	// wrong here) -- `Object.values` reads correctly either way. Only
	// overrides whose raw RECURRENCE-ID sits beyond the window are handled
	// here; one within the window is reached normally by the walk below,
	// which already applies to it whatever `getOccurrenceDetails` returns
	// (its moved-to start, if this is an override at all).
	//
	// The `EXDATE` check keeps this loop agreeing with the walk below on an
	// EXDATE'd `RECURRENCE-ID`: the walk never reaches (and so never
	// overrides) an EXDATE'd position when it's inside the window, since
	// `RecurExpansion` excludes it from the occurrence stream entirely --
	// without the same check here, that exact position, if beyond the
	// window, would apply anyway, purely as an accident of which side of
	// `windowEnd` it happened to fall on.
	//
	// There's one thing this loop still can't agree with the walk on: a
	// `RECURRENCE-ID` that names a time the base rule never actually
	// produces at all -- past a `COUNT`/`UNTIL` boundary, or not matching a
	// `BYDAY`/`BYMONTH` restriction, say. Inside the window, the walk simply
	// never reaches that position, so no override applies; here, with no
	// membership test, a beyond-window `RECURRENCE-ID` in that same
	// situation is taken at face value and its override still fires,
	// producing a phantom occurrence the base rule never actually
	// schedules. Closing that gap needs the same recurrence-set membership
	// logic `RecurExpansion` itself runs internally (evaluating `BYDAY`/
	// `BYMONTH`/`COUNT`/`UNTIL` against an arbitrary candidate `Time`,
	// nothing this parser has a cheap way to do without walking the
	// iterator there, which is the exact cost this loop exists to avoid).
	// RFC 5545 requires a `RECURRENCE-ID` to name an actual instance of the
	// recurrence set in the first place, so this situation only arises from
	// a calendar that's already violating the spec -- deliberately left
	// unhandled rather than reintroducing an iterator walk to guard against
	// malformed input, but noted here (and pinned by a test) rather than
	// silently accepted.
	for (let exception of Object.values(event.exceptions)) {
		if (!isAfter(toInstant(exception.recurrenceId), windowEnd)) continue
		if (isExcludedByExdate(event.component, exception.recurrenceId)) continue
		tryPush(exception.recurrenceId)
	}

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

		// RDATE;VALUE=PERIOD is the one shape that can put a non-Time value
		// into this stream -- see isIcalTime. Unsupported, but only for this
		// one occurrence: skip it and keep walking the rest of the series.
		if (!isIcalTime(occurrence)) continue

		if (isAfter(toInstant(occurrence), windowEnd)) break

		tryPush(occurrence)
	}

	return occurrences
}

/// A dedicated error class for a body that doesn't parse as iCalendar at all
/// -- as opposed to one that parses fine but describes an event this parser
/// can't expand (a missing `DTSTART`, an exhausted ceiling, and so on).
///
/// `ICAL.Component.fromString` doesn't fail uniformly on bad input. An HTML
/// body, or one where the very first line already can't be read as an
/// iCalendar content line (an RSS or Atom document's `<?xml ...?>` prologue,
/// say), is rejected by `ical.js`'s own line parser with a clean,
/// already-attributable `ParserError`. But some inputs parse as a sequence of
/// content lines just well enough to produce a malformed internal `jCal`
/// tree, and the failure only surfaces later, inside `ical.js` internals, as
/// an anonymous `TypeError: Cannot read properties of undefined (reading
/// 'propertyGroups')` -- reproduced directly against a JSON body (an
/// easy mistake for a manifest entry pointing at the wrong source). That
/// message says nothing about iCalendar at all, so in Sentry it's
/// indistinguishable from a real bug in this parser's own code. Catching
/// both failure shapes here and re-throwing as this one error, with the
/// original attached as `cause`, makes every "this body isn't iCalendar"
/// case attributable the same way, without losing the underlying detail.
export class IcalBodyParseError extends Error {}

/// Parses `text` and returns its `VEVENT`s directly, forcing -- in the same
/// try/catch -- the one other call (`getAllSubcomponents`) that can still
/// throw on a body that isn't really iCalendar. An empty or whitespace-only
/// body parses via `ICAL.Component.fromString` without error (there's no
/// content line to reject), but leaves the component's internal `jCal` tree
/// without the shape `getAllSubcomponents` expects, so the same anonymous
/// `TypeError` surfaces one call later instead. Both calls are wrapped
/// together so neither failure shape can leak past this function
/// unattributed.
function parseVevents(text: string): ICAL.Component[] {
	try {
		return ICAL.Component.fromString(text).getAllSubcomponents('vevent')
	} catch (error) {
		throw new IcalBodyParseError('ical body is not valid iCalendar', {cause: error})
	}
}

function uidOf(component: ICAL.Component): string | undefined {
	let uid = component.getFirstPropertyValue('uid')
	return typeof uid === 'string' && uid ? uid : undefined
}

/// The outer shape stays strict: a body that isn't a string at all (rejected
/// by `z.string().parse`), or isn't parseable iCalendar (rejected by
/// `parseVevents`, as `IcalBodyParseError`), means the source is wrong, and
/// that should throw. Each master `VEVENT` (one without its own
/// `RECURRENCE-ID` -- i.e. not itself an override) is then converted on its
/// own, so one event this feed can't fully describe (a missing `DTSTART`,
/// for instance) doesn't blank the rest of the calendar. `RECURRENCE-ID`
/// overrides are matched to their master by `UID` and passed in explicitly,
/// rather than relying on `ical.js`'s own automatic matching, which does not
/// consider `UID` at all and would relate every override in the calendar to
/// every master.
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
/// A master that hits the iteration or occurrence ceiling is dropped the
/// same way any other malformed master is -- its siblings are unaffected,
/// whether it throws `RecurrenceIterationCeilingError`,
/// `RecurrenceOccurrenceCeilingError`, or fails for some ordinary reason (a
/// missing `DTSTART`, say). But when *every* master fails and the
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
	let vevents = parseVevents(text)

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
