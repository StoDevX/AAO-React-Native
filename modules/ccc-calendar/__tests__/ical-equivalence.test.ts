import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {decode, htmlToSegments} from '@frogpond/html-lib'
import {addDays, endOfDay, isAfter, isBefore, startOfDay, isSameDay, isSameMinute} from 'date-fns'
import ICAL from 'ical.js'
import {
	computeSeedTime,
	parseIcalEvents,
	RecurrenceIterationCeilingError,
	seekableRule,
} from '../parsers/ical'
import type {WireEvent} from '../parsers/events'

// This file is the safety net for `ical.ts`'s performance work, not a
// replacement for `ical.test.ts`'s own coverage. Every fix this parser has
// gone through (recurrence expansion, an occurrence cap, a moved override, a
// pulled-in override) shipped a *correct-looking, wrong* calendar that
// rendered fine and was only caught by a human reviewer -- never by a test,
// because no test compared the parser's output to an independently-computed
// ground truth. This file is that ground truth: a reference walk built
// directly on `ical.js`, deliberately naive, with none of `ical.ts`'s
// performance concessions (no seeding, no iteration ceiling, no occurrence
// cap), so a regression shows up as a deep-equality diff instead of a human
// noticing an odd time months later.
//
// The reference is intentionally NOT built by importing `ical.ts`'s own
// helpers -- sharing code would mean a bug introduced in that shared code is
// invisible to both sides at once. It is independently written against
// `ical.js` directly, even though that means it structurally resembles
// `expandOccurrences` in places: this parser's own hardened behaviour
// (RECURRENCE-ID overrides, EXDATE truncation, the RDATE-only DTSTART gap)
// *is* the obviously-correct RFC 5545 reading at this point, six review
// rounds in, so an independent implementation of the same spec looks similar
// by necessity. What differs, and what this file exists to police, is
// everything performance-motivated: seeding the iterator near the window
// instead of walking from DTSTART, and the iteration/occurrence ceilings.

/// Resolves `time` the same way `ical.ts`'s own `toInstant` does: a
/// `VALUE=DATE` time is host-independent UTC midnight (it has no time zone by
/// definition), everything else resolves through `Time#toJSDate()`, which is
/// already zone-correct (or, for a floating time, host-zone-correct, which is
/// the intended reading of a floating time for a viewer in that zone).
function referenceToInstant(time: ICAL.Time): Date {
	if (time.isDate) {
		return new Date(Date.UTC(time.year, time.month - 1, time.day))
	}
	return time.toJSDate()
}

function referenceIsIcalTime(value: ICAL.Time | ICAL.Period): value is ICAL.Time {
	return !(value instanceof ICAL.Period)
}

/// Mirrors `RecurExpansion#_compare_special`: a `DATE`-valued `EXDATE`
/// excludes a `DATE-TIME` occurrence that falls on the same calendar day, not
/// only an exact instant match.
function referenceExdateExcludes(component: ICAL.Component, time: ICAL.Time): boolean {
	return component.getAllProperties('exdate').some((property) =>
		property.getValues().some((value) => {
			let exdate = value as ICAL.Time
			if (!time.isDate && exdate.isDate) {
				return time.year === exdate.year && time.month === exdate.month && time.day === exdate.day
			}
			return time.compare(exdate) === 0
		}),
	)
}

const BARE_URL_PATTERN = /https?:\/\/[^\s<>"']+/gu

function referenceStripTrailingPunctuation(url: string): string {
	let trimmed = url.replace(/[.,;:!?\]]+$/u, '')
	while (trimmed.endsWith(')')) {
		let opens = trimmed.match(/\(/gu)?.length ?? 0
		let closes = trimmed.match(/\)/gu)?.length ?? 0
		if (closes <= opens) break
		trimmed = trimmed.slice(0, -1)
	}
	return trimmed
}

function referenceLinksIn(descriptionHtml: string): string[] {
	let anchorLinks = htmlToSegments(descriptionHtml).flatMap((segment) =>
		segment.type === 'link' ? [segment.url] : [],
	)
	let bareLinks = (descriptionHtml.match(BARE_URL_PATTERN) ?? []).map(
		referenceStripTrailingPunctuation,
	)
	return [...new Set([...anchorLinks, ...bareLinks])]
}

function referenceToWireEvent(
	item: ICAL.Event,
	startTime: ICAL.Time,
	endTime: ICAL.Time,
	now: Date,
): WireEvent {
	let startJsDate = referenceToInstant(startTime)
	let endJsDate = referenceToInstant(endTime)

	let startIso = startJsDate.toISOString()
	let endIso = endJsDate.toISOString()

	let isAllDay = item.startDate.isDate && item.endDate.isDate

	let descriptionHtml = item.description ?? ''

	return {
		dataSource: 'ical',
		startTime: startIso,
		endTime: endIso,
		isAllDay,
		isMultiDay: !isAllDay && !isSameDay(startJsDate, endJsDate),
		isSameInstant: !isAllDay && isSameMinute(startJsDate, endJsDate),
		title: item.summary ?? '',
		description: decode(descriptionHtml).replace(/\s+/gu, ' ').trim(),
		location: item.location ?? '',
		isOngoing: isBefore(new Date(startIso), startOfDay(now)),
		links: referenceLinksIn(descriptionHtml),
		categories: [],
		config: {
			startTime: !isAllDay,
			endTime: !isAllDay,
			subtitle: 'location',
		},
	}
}

/// The reference walk's own analogue of `RecurrenceIterationCeilingError`,
/// thrown when `maxIterations` is supplied and exceeded -- see
/// `expectEquivalentOrBothCeilinged` for why the corpus tests need a
/// distinguishable error here rather than letting an unbounded `SECONDLY` or
/// `MINUTELY` walk simply run to whatever wall-clock cost it wants.
class ReferenceIterationCeilingError extends Error {}

/// Walks every occurrence of `event` from its true `DTSTART` -- never seeded
/// closer to `now` -- applying overrides and EXDATE along the way, and
/// keeping whatever lands inside the window.
///
/// `maxIterations`, when given, throws `ReferenceIterationCeilingError` once
/// exceeded, exactly where `ical.ts`'s own `RecurrenceIterationCeilingError`
/// would fire -- both walk the same candidates in the same order, so the two
/// ceilings are hit at the same iteration count. Undefined by default (no
/// cap at all), preserving this file's original fixture/synthetic-case
/// behaviour untouched; only the corpus tests below, which run real
/// `SECONDLY`/`MINUTELY` rules that are legitimately unbounded, pass one.
function referenceExpandOccurrences(
	event: ICAL.Event,
	now: Date,
	windowDays: number,
	maxIterations?: number,
): WireEvent[] {
	if (!event.isRecurring()) {
		return [referenceToWireEvent(event, event.startDate, event.endDate, now)]
	}

	let windowEnd = addDays(now, windowDays)
	let endOfToday = endOfDay(now)
	let occurrences: WireEvent[] = []

	function tryPush(occurrenceTime: ICAL.Time): void {
		let details = event.getOccurrenceDetails(occurrenceTime)
		if (isAfter(referenceToInstant(details.startDate), windowEnd)) return
		if (!isAfter(referenceToInstant(details.endDate), endOfToday)) return
		occurrences.push(referenceToWireEvent(details.item, details.startDate, details.endDate, now))
	}

	// ical.js only emits DTSTART itself as an occurrence when the series has
	// an RRULE -- an RDATE-only series never gets it, even though RFC 5545
	// counts DTSTART as always part of the recurrence set.
	if (event.component.hasProperty('rdate') && !event.component.hasProperty('rrule')) {
		let dtstart = event.startDate
		let alreadyInRdate = event.component
			.getAllProperties('rdate')
			.some((property) =>
				property
					.getValues()
					.some(
						(value) =>
							referenceIsIcalTime(value) &&
							referenceToInstant(value).getTime() === referenceToInstant(dtstart).getTime(),
					),
			)
		if (!alreadyInRdate && !referenceExdateExcludes(event.component, dtstart)) {
			tryPush(dtstart)
		}
	}

	// A beyond-window RECURRENCE-ID override never gets reached by the walk
	// below (it stops at windowEnd), so it's applied directly from its own
	// already-known startDate.
	for (let exception of Object.values(event.exceptions)) {
		if (!isAfter(referenceToInstant(exception.recurrenceId), windowEnd)) continue
		if (referenceExdateExcludes(event.component, exception.recurrenceId)) continue
		tryPush(exception.recurrenceId)
	}

	// The naive part: no seed. Every candidate occurrence from DTSTART is
	// walked and thrown away until the window is reached, or (corpus tests
	// only) `maxIterations` is.
	let iterator = event.iterator()
	for (let iterations = 0; ; iterations += 1) {
		let occurrence = iterator.next()
		if (!occurrence) break
		if (maxIterations !== undefined && iterations >= maxIterations) {
			throw new ReferenceIterationCeilingError(
				`reference walk exceeded ${maxIterations} recurrence iterations without reaching the expansion window`,
			)
		}
		if (!referenceIsIcalTime(occurrence)) continue
		if (isAfter(referenceToInstant(occurrence), windowEnd)) break
		tryPush(occurrence)
	}

	return occurrences
}

/// `maxIterations`, when given, is threaded into `referenceExpandOccurrences`
/// and this function's own per-master success/failure accounting mirrors
/// `parseIcalEvents`'s -- a master that hits the ceiling is dropped, like any
/// other malformed master, and only a non-empty calendar where *every* master
/// fails throws (with the most recent failure attached as `cause`). Without
/// this mirroring, a corpus file mixing one ceiling-hitting master with
/// otherwise-fine ones (there are two -- `Bug2912657.ics`, `Bug2916581.ics`)
/// would diverge from `parseIcalEvents` on that aggregation behaviour alone,
/// not on anything about recurrence itself.
function referenceParseIcalEvents(
	body: string,
	now: Date,
	windowDays: number,
	maxIterations?: number,
): WireEvent[] {
	let calendar = ICAL.Component.fromString(body)
	let vevents = calendar.getAllSubcomponents('vevent')
	let masters = vevents.filter((vevent) => !vevent.hasProperty('recurrence-id'))

	let overridesByUid = new Map<string, ICAL.Component[]>()
	for (let vevent of vevents) {
		if (!vevent.hasProperty('recurrence-id')) continue
		let uid = vevent.getFirstPropertyValue('uid')
		if (typeof uid !== 'string' || !uid) continue
		overridesByUid.set(uid, [...(overridesByUid.get(uid) ?? []), vevent])
	}

	let successCount = 0
	let lastError: unknown
	let events = masters.flatMap((vevent) => {
		try {
			let uid = vevent.getFirstPropertyValue('uid')
			let overrides = (typeof uid === 'string' && overridesByUid.get(uid)) || []
			let event = new ICAL.Event(vevent, {
				exceptions: overrides.map((override) => new ICAL.Event(override)),
				strictExceptions: true,
			})
			let occurrences = referenceExpandOccurrences(event, now, windowDays, maxIterations)
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

const DEFAULT_WINDOW_DAYS = 90

function expectEquivalentToReference(
	body: string,
	now: Date,
	windowDays = DEFAULT_WINDOW_DAYS,
): void {
	let actual = parseIcalEvents(body, now, {windowDays})
	let expected = referenceParseIcalEvents(body, now, windowDays)
	expect(actual).toStrictEqual(expected)
}

/// How many of `body`'s master `VEVENT`s actually take `ical.ts`'s seeded
/// fast path for the given `now`. Calls the real, exported `seekableRule`/
/// `computeSeedTime` directly -- not a hand-maintained re-implementation of
/// their logic -- so this stays truthful if that predicate ever changes,
/// rather than silently drifting the way a duplicated copy would.
///
/// A deep-equality pass from `expectEquivalentToReference` proves the seeded
/// and unseeded paths agree on output; it says nothing about whether a given
/// case actually exercised the seeded path at all. Most of this file's
/// synthetic `DTSTART`s sit only days from `NOW` (chosen for readable
/// literals), which is exactly the case `computeSeedTime` declines to seed --
/// so without this, a case can pass every assertion here while only ever
/// running the unseeded walk, proving nothing about seeding specifically.
function seededMasterCount(body: string, now: Date): number {
	let calendarComponent = ICAL.Component.fromString(body)
	let vevents = calendarComponent.getAllSubcomponents('vevent')
	let masters = vevents.filter((vevent) => !vevent.hasProperty('recurrence-id'))

	let count = 0
	for (let vevent of masters) {
		let event = new ICAL.Event(vevent)
		if (!event.isRecurring()) continue

		let rule = seekableRule(event.component)
		if (!rule) continue

		let durationSeconds =
			(referenceToInstant(event.endDate).getTime() -
				referenceToInstant(event.startDate).getTime()) /
			1000
		if (computeSeedTime(event.startDate, rule, now, durationSeconds)) count += 1
	}
	return count
}

// --- Real fixtures --------------------------------------------------------

const fixture = readFileSync(join(__dirname, 'fixtures/ical.ics'), 'utf8')
const outlookFixture = readFileSync(join(__dirname, 'fixtures/ical-microsoft-outlook.ics'), 'utf8')
const appleFixture = readFileSync(join(__dirname, 'fixtures/ical-apple-calendar.ics'), 'utf8')

test('the KSTO fixture matches the naive reference walk', () => {
	expectEquivalentToReference(fixture, new Date('2026-08-15T12:00:00Z'))
})

test('the Outlook fixture matches the naive reference walk', () => {
	expectEquivalentToReference(outlookFixture, new Date('2026-08-15T12:00:00Z'))
})

test('the Apple Calendar fixture matches the naive reference walk', () => {
	expectEquivalentToReference(appleFixture, new Date('2013-10-25T12:00:00Z'))
})

// --- Synthetic shapes -------------------------------------------------

function calendar(vevents: string, vtimezone = ''): string {
	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
${vtimezone}${vevents}
END:VCALENDAR
`
}

const CHICAGO_VTIMEZONE = `BEGIN:VTIMEZONE
TZID:America/Chicago
X-LIC-LOCATION:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
`

const NOW = new Date('2026-08-15T12:00:00Z')

interface SyntheticCase {
	name: string
	body: string
	now?: Date
	windowDays?: number
	/// How many master `VEVENT`s in `body` are expected to take the seeded
	/// fast path for `now ?? NOW`, verified against the real predicate via
	/// `seededMasterCount` -- not just asserted, but checked. Every case
	/// states this explicitly (no default) so adding a case means deciding,
	/// and documenting, which path it's meant to exercise.
	expectedSeededMasters: number
}

const SYNTHETIC_CASES: SyntheticCase[] = [
	{
		// RFC 5545 DESCRIPTION is plain text, so angle brackets are content,
		// not markup. Without a case carrying them, the parser and the
		// reference could drift apart on this field and nothing here would
		// notice -- which is how the field came to be HTML-stripped in the
		// first place.
		name: 'description containing angle brackets and entities',
		body: calendar(`BEGIN:VEVENT
UID:plain-text-description@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
SUMMARY:Plain text description
DESCRIPTION:Email <alice@x.edu> or see <https://stolaf.edu/x> -- a < b &amp; c
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'weekly with BYDAY',
		body: calendar(`BEGIN:VEVENT
UID:weekly-byday@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
SUMMARY:Weekly byday
END:VEVENT`),
		// A multi-day BYDAY list is unseekable at any age -- `seekableRule`
		// only accepts a single BYDAY entry. See the seeded twin below for
		// the single-BYDAY case this parser's real feed is actually built
		// from.
		expectedSeededMasters: 0,
	},
	{
		name: 'weekly with a single BYDAY, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:weekly-byday-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Weekly byday seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		// `seekableRule` only accepts a WEEKLY rule whose sole `BY*` part is a
		// single `BYDAY` -- any other part (here, `BYHOUR`) makes it
		// unseekable regardless of age, because the seed jumps forward by
		// whole weeks of wall-clock field arithmetic without ever considering
		// which hours within a week `BYHOUR` restricts the walk to. Aged so
		// this would take the seeded path if that guard were ever removed
		// (see `seekableRule`'s own comment on the corpus's WEEKLY-plus-BY*
		// coverage gap) -- `expectedSeededMasters: 0` pins that it does not.
		name: 'weekly with BYDAY and BYHOUR, old enough that a missing guard would seed it',
		body: calendar(`BEGIN:VEVENT
UID:weekly-byday-byhour@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;BYHOUR=9,17
SUMMARY:Weekly byday byhour
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// Same guard, a different extra `BY*` part: `BYSETPOS` picks one
		// occurrence out of each period's candidate set by position, which a
		// seed that jumps forward by whole weeks (assuming every week
		// produces exactly the occurrences `BYDAY` alone would) does not
		// account for either.
		name: 'weekly with BYDAY and BYSETPOS, old enough that a missing guard would seed it',
		body: calendar(`BEGIN:VEVENT
UID:weekly-byday-bysetpos@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;BYSETPOS=1
SUMMARY:Weekly byday bysetpos
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'daily, too recent to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:daily-recent@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=DAILY
SUMMARY:Daily recent
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'daily, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:daily@test
DTSTART:20150101T130000Z
DTEND:20150101T140000Z
RRULE:FREQ=DAILY
SUMMARY:Daily
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		// MONTHLY is never seekable regardless of age -- the implicit
		// day-of-month anchor can land somewhere that doesn't exist in every
		// target month, so `seekableRule` excludes it outright. This DTSTART
		// is already old (2018): the point isn't that it's too recent to
		// seed, it's that this shape never seeds at all.
		name: 'monthly',
		body: calendar(`BEGIN:VEVENT
UID:monthly@test
DTSTART:20180115T130000Z
DTEND:20180115T140000Z
RRULE:FREQ=MONTHLY
SUMMARY:Monthly
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// Same as MONTHLY: never seekable, regardless of age -- an already-old
		// DTSTART pins that this is by design, not by insufficient age.
		name: 'yearly',
		body: calendar(`BEGIN:VEVENT
UID:yearly@test
DTSTART:20180301T130000Z
DTEND:20180301T140000Z
RRULE:FREQ=YEARLY
SUMMARY:Yearly
END:VEVENT`),
		windowDays: 3650,
		expectedSeededMasters: 0,
	},
	{
		// Spans both the spring-forward (second Sunday of March) and
		// fall-back (first Sunday of November) DST transitions embedded in
		// the VTIMEZONE above. DTSTART sits on `now` itself, so this is the
		// unseeded case.
		name: 'weekly rule crossing DST boundaries in both directions',
		body: calendar(
			`BEGIN:VEVENT
UID:dst-both@test
DTSTART;TZID=America/Chicago:20260201T200000
DTEND;TZID=America/Chicago:20260201T210000
RRULE:FREQ=WEEKLY;BYDAY=SU
SUMMARY:DST spanning
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		now: new Date('2026-02-01T12:00:00Z'),
		windowDays: 300,
		expectedSeededMasters: 0,
	},
	{
		// The seeded twin of the above: same rule, same `now` and window (so
		// the walk still spans both 2026 DST transitions), but DTSTART moved
		// back to 2019-03-03 -- the nearest earlier Sunday, keeping BYDAY=SU
		// alignment -- so it's old enough to seed.
		name: 'weekly rule crossing DST boundaries in both directions, old enough to be seeded',
		body: calendar(
			`BEGIN:VEVENT
UID:dst-both-seeded@test
DTSTART;TZID=America/Chicago:20190303T200000
DTEND;TZID=America/Chicago:20190303T210000
RRULE:FREQ=WEEKLY;BYDAY=SU
SUMMARY:DST spanning seeded
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		now: new Date('2026-02-01T12:00:00Z'),
		windowDays: 300,
		expectedSeededMasters: 1,
	},
	{
		name: 'all-day recurring',
		body: calendar(`BEGIN:VEVENT
UID:allday-recur@test
DTSTART;VALUE=DATE:20260822
DTEND;VALUE=DATE:20260823
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=6
SUMMARY:Allday recur
END:VEVENT`),
		// COUNT makes this unseekable regardless of age -- see the seeded
		// twin below, which is identical except COUNT is dropped and DTSTART
		// is aged (same weekday, so the same occurrences result).
		expectedSeededMasters: 0,
	},
	{
		name: 'all-day recurring, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:allday-recur-seeded@test
DTSTART;VALUE=DATE:20190309
DTEND;VALUE=DATE:20190310
RRULE:FREQ=WEEKLY;BYDAY=SA
SUMMARY:Allday recur seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'EXDATE in plain form',
		body: calendar(`BEGIN:VEVENT
UID:exdate-plain@test
DTSTART:20260822T130000Z
DTEND:20260822T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE:20260829T130000Z
SUMMARY:Exdate plain
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// Same EXDATE (2026-08-29, a Saturday in the current window) against
		// an aged, uncapped version of the same base rule -- the excluded
		// occurrence now falls inside the seeded walk's reachable range, not
		// off in the unreachable past, so this actually exercises EXDATE
		// exclusion post-seeding rather than merely being old.
		name: 'EXDATE in plain form, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:exdate-plain-seeded@test
DTSTART:20190309T130000Z
DTEND:20190309T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA
EXDATE:20260829T130000Z
SUMMARY:Exdate plain seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'EXDATE in TZID form',
		body: calendar(
			`BEGIN:VEVENT
UID:exdate-tzid@test
DTSTART;TZID=America/Chicago:20260822T080000
DTEND;TZID=America/Chicago:20260822T090000
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE;TZID=America/Chicago:20260829T080000
SUMMARY:Exdate tzid
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		expectedSeededMasters: 0,
	},
	{
		name: 'EXDATE in TZID form, old enough to be seeded',
		body: calendar(
			`BEGIN:VEVENT
UID:exdate-tzid-seeded@test
DTSTART;TZID=America/Chicago:20190309T080000
DTEND;TZID=America/Chicago:20190309T090000
RRULE:FREQ=WEEKLY;BYDAY=SA
EXDATE;TZID=America/Chicago:20260829T080000
SUMMARY:Exdate tzid seeded
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		expectedSeededMasters: 1,
	},
	{
		name: 'EXDATE in DATE form',
		body: calendar(`BEGIN:VEVENT
UID:exdate-date@test
DTSTART;VALUE=DATE:20260822
DTEND;VALUE=DATE:20260823
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE;VALUE=DATE:20260829
SUMMARY:Exdate date
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'EXDATE in DATE form, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:exdate-date-seeded@test
DTSTART;VALUE=DATE:20190309
DTEND;VALUE=DATE:20190310
RRULE:FREQ=WEEKLY;BYDAY=SA
EXDATE;VALUE=DATE:20260829
SUMMARY:Exdate date seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'RDATE alone',
		body: calendar(`BEGIN:VEVENT
UID:rdate-alone@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE:20260908T130000Z,20260915T130000Z
SUMMARY:Rdate alone
END:VEVENT`),
		// No RRULE at all -- `seekableRule` requires exactly one, so an
		// RDATE-only series is never seekable regardless of DTSTART's age.
		expectedSeededMasters: 0,
	},
	{
		// The RDATE-only injected-DTSTART gap (`needsInjectedDtstart` in
		// ical.ts) combined with an EXDATE that excludes it. This occurrence
		// is never reached by ical.js's own RecurExpansion at all (see the
		// comment on `needsInjectedDtstart`), so its EXDATE truncation is
		// ical.ts's own, separate `isExcludedByExdate` check -- unseekable
		// (no RRULE), but a real gap in coverage until this case existed: no
		// other case combined RDATE-only with EXDATE.
		name: 'an EXDATE naming the DTSTART of an RDATE-only series excludes it',
		body: calendar(`BEGIN:VEVENT
UID:rdate-only-exdate-dtstart@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE:20260908T130000Z,20260915T130000Z
EXDATE;VALUE=DATE:20260901
SUMMARY:Rdate only exdate dtstart
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'RDATE alongside an RRULE',
		body: calendar(`BEGIN:VEVENT
UID:rdate-with-rule@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=3
RDATE:20260825T180000Z
SUMMARY:Rdate plus rule
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// Same RDATE (2026-08-25, still inside the current window) against an
		// aged, uncapped version of the base rule. `RecurExpansion` seeds its
		// RDATE binary search from the same seed position as the RRULE
		// iterator (see `computeSeedTime`'s own doc comment on `RDATE`), so
		// this exercises that interaction directly.
		name: 'RDATE alongside an RRULE, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:rdate-with-rule-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
RDATE:20260825T180000Z
SUMMARY:Rdate plus rule seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'RECURRENCE-ID override inside the window',
		body: calendar(`BEGIN:VEVENT
UID:override-in@test
DTSTART:20260822T130000Z
DTEND:20260822T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=3
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-in@test
RECURRENCE-ID:20260829T130000Z
DTSTART:20260829T150000Z
DTEND:20260829T160000Z
SUMMARY:Override
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'RECURRENCE-ID override inside the window, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:override-in-seeded@test
DTSTART:20190309T130000Z
DTEND:20190309T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-in-seeded@test
RECURRENCE-ID:20260829T130000Z
DTSTART:20260829T150000Z
DTEND:20260829T160000Z
SUMMARY:Override
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'RECURRENCE-ID override just beyond the window',
		body: calendar(`BEGIN:VEVENT
UID:override-just-beyond@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-just-beyond@test
RECURRENCE-ID:20261124T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Pulled in
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'RECURRENCE-ID override just beyond the window, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:override-just-beyond-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-just-beyond-seeded@test
RECURRENCE-ID:20261124T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Pulled in
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'RECURRENCE-ID override years beyond the window',
		body: calendar(`BEGIN:VEVENT
UID:override-years-beyond@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-years-beyond@test
RECURRENCE-ID:20350101T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Pulled in from years out
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'RECURRENCE-ID override years beyond the window, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:override-years-beyond-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:override-years-beyond-seeded@test
RECURRENCE-ID:20350101T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Pulled in from years out
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		// The other guarded EXDATE path: a beyond-window override whose
		// un-overridden RECURRENCE-ID position is itself EXDATE'd (see
		// `isExcludedByExdate`'s use in the override loop in ical.ts), now
		// combined with an aged, seeded base rule -- the base rule's own
		// walk starts from a seed, but the beyond-window override lookup
		// bypasses the walk entirely (it's found directly from its own
		// startDate), so this checks that the EXDATE suppression still
		// applies to that lookup once seeding is in the picture.
		name: 'a beyond-window override at an EXDATE-excluded position, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:exdatedoverride-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE:20261201T130000Z
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:exdatedoverride-seeded@test
RECURRENCE-ID:20261201T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Should not appear
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'COUNT-limited rule',
		body: calendar(`BEGIN:VEVENT
UID:count-limited@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=DAILY;COUNT=10
SUMMARY:Count limited
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// DTSTART is old enough to be a seeding candidate, but the rule's own
		// COUNT is small enough that its real occurrences are long exhausted
		// by NOW. `RecurIterator` enforces COUNT by counting from wherever it
		// started, not from the true DTSTART -- seeding this rule near `now`
		// would restart that count and manufacture occurrences the real,
		// unseeded series never has. `seekableRule` in ical.ts excludes any
		// COUNT-limited rule for exactly this reason. This is the regression
		// case for that exact bug (found via ical.test.ts, not this file, the
		// first time -- see the report).
		name: 'COUNT-limited rule old enough to be a seeding candidate',
		body: calendar(`BEGIN:VEVENT
UID:count-limited-old@test
DTSTART:20150101T130000Z
DTEND:20150101T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=5
SUMMARY:Count limited, long exhausted
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'UNTIL-limited rule',
		body: calendar(`BEGIN:VEVENT
UID:until-limited@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=DAILY;UNTIL=20260901T130000Z
SUMMARY:Until limited
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		// UNTIL is a plain absolute-time comparison against `this.last`,
		// independent of where the walk started, so it's left unrestricted by
		// `seekableRule` -- this is the positive case proving that holds once
		// the rule is actually old enough to seed.
		name: 'UNTIL-limited rule, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:until-limited-seeded@test
DTSTART:20190305T130000Z
DTEND:20190305T140000Z
RRULE:FREQ=DAILY;UNTIL=20260901T130000Z
SUMMARY:Until limited seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'floating-time rule',
		body: calendar(`BEGIN:VEVENT
UID:floating-rule@test
DTSTART:20260818T130000
DTEND:20260818T140000
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=5
SUMMARY:Floating
END:VEVENT`),
		expectedSeededMasters: 0,
	},
	{
		name: 'floating-time rule, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:floating-rule-seeded@test
DTSTART:20190305T130000
DTEND:20190305T140000
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Floating seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
	{
		name: 'DTSTART with a TZID other than the host zone',
		body: calendar(
			`BEGIN:VEVENT
UID:other-tzid@test
DTSTART;TZID=America/Chicago:20260901T130000
DTEND;TZID=America/Chicago:20260901T140000
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=5
SUMMARY:Other zone
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		expectedSeededMasters: 0,
	},
	{
		name: 'DTSTART with a TZID other than the host zone, old enough to be seeded',
		body: calendar(
			`BEGIN:VEVENT
UID:other-tzid-seeded@test
DTSTART;TZID=America/Chicago:20190319T130000
DTEND;TZID=America/Chicago:20190319T140000
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Other zone seeded
END:VEVENT`,
			CHICAGO_VTIMEZONE,
		),
		expectedSeededMasters: 1,
	},
	{
		name: 'a multi-day event straddling the window edge',
		body: calendar(`BEGIN:VEVENT
UID:straddle@test
DTSTART:20260801T130000Z
DTEND:20261115T140000Z
SUMMARY:Straddling
END:VEVENT`),
		// Non-recurring -- `expandOccurrences` never seeds a non-recurring
		// event at all (see the `!event.isRecurring()` branch it returns
		// from immediately).
		expectedSeededMasters: 0,
	},
	{
		// The regression case for the duration bug found in review: a
		// recurring occurrence long enough to still be in progress at `now`
		// even though it started well before the seed. Without subtracting
		// the occurrence's own duration when computing the seed,
		// `RecurExpansion`'s RDATE/EXDATE binary search (seeded from the same
		// position as the RRULE iterator) and the RRULE walk itself both skip
		// straight past any occurrence that started earlier than the seed --
		// regardless of how long it runs past that point -- silently
		// dropping exactly the occurrence `isOngoing` and the
		// `endTime > endOfToday` filter in ical.ts exist to keep.
		name: 'a long-duration recurring occurrence still in progress at NOW, old enough to be seeded',
		body: calendar(`BEGIN:VEVENT
UID:long-duration-seeded@test
DTSTART:20190101T130000Z
DTEND:20190111T130000Z
RRULE:FREQ=DAILY
SUMMARY:Long duration seeded
END:VEVENT`),
		expectedSeededMasters: 1,
	},
]

test.each(SYNTHETIC_CASES)(
	'$name matches the naive reference walk',
	({body, now, windowDays, expectedSeededMasters}) => {
		let effectiveNow = now ?? NOW
		expectEquivalentToReference(body, effectiveNow, windowDays)
		expect(seededMasterCount(body, effectiveNow)).toBe(expectedSeededMasters)
	},
)

// Coverage over the deep-equality assertions above says nothing on its own:
// a case whose DTSTART never reaches the seeded path proves the unseeded
// walk agrees with itself, not that seeding is correct. This is what makes
// that failure mode visible instead of silent -- if a future edit ages a
// case back down, or `seekableRule` narrows enough that today's "seeded"
// cases stop qualifying, the count drops and this fails, rather than the
// harness quietly reverting to policing only the unseeded path.
test('enough synthetic cases actually take the seeded path to make the harness meaningful', () => {
	let totalSeeded = SYNTHETIC_CASES.reduce(
		(sum, {body, now}) => sum + seededMasterCount(body, now ?? NOW),
		0,
	)
	expect(totalSeeded).toBeGreaterThanOrEqual(15)
})

// --- Third-party corpus: ical-org/ical.net's Recurrence test suite --------
//
// See `fixtures/ical-corpus/README.md` for provenance, licence, and what was
// excluded from the upstream 71 files. Where the cases above are synthetic
// shapes chosen to exercise one thing each, this corpus is 70 real,
// independently-authored recurrence documents -- every `RRULE` frequency,
// and every rule part (`BYDAY`, `BYMONTH`, `INTERVAL`, `COUNT`,
// `BYMONTHDAY`, `WKST`, `UNTIL`, `BYHOUR`, `BYWEEKNO`, `BYSETPOS`,
// `BYMINUTE`, `BYYEARDAY`) that matters to this parser.
//
// History between DTSTART and "now" is exactly what makes the naive
// reference walk expensive, but it's also the only thing that makes seeding
// engage at all -- so each file below runs twice:
//
//   - once with `now` the day before the file's own earliest DTSTART: as
//     close to "no history to walk" as this parser's own future-only filter
//     allows (see `earliestDtstart`'s own comment on why exactly-at-DTSTART
//     doesn't work), so this is fast on both sides regardless of frequency,
//     and checks shape correctness on the unseeded path (`computeSeedTime`
//     never engages when there's nothing to seed past);
//   - once with `now` `CORPUS_SEED_GAP_PERIODS` periods later: old enough
//     that every structurally-seekable rule in the file actually gets
//     seeded, so this checks that the seeded and unseeded paths agree, not
//     just that the unseeded path works on its own.
//
// A fixed, small `windowDays` -- 2, for every file and every pass -- was
// this suite's original design: cheap, but it made the vast majority of the
// corpus vacuous. Roughly 40 of the 70 files are MONTHLY or YEARLY, whose
// own period is longer than a 2-day window could ever observe a second
// occurrence within; a 2-day window run against a `now` sitting exactly on
// `DTSTART` also excludes `DTSTART`'s own occurrence for any event whose
// duration doesn't cross a calendar-day boundary (this parser's
// "not already over" filter operates on whole days -- see `toWireEvent`'s
// `isOngoing`/`endOfToday` handling in `ical.ts`). Combined, a full count
// (see the assertions at the bottom of this section) showed 95 of the 140
// file/pass combinations were comparing `[] === []`: two empty arrays agree
// trivially, proving nothing about whether the parser and the reference walk
// actually agree on any real content.
//
// `windowDaysFor`, below, replaces the fixed constant with a per-file,
// per-pass window: wide enough to observe a real occurrence for whatever
// that file's own rule actually needs (probed directly against `ical.js`'s
// own iterator, rather than hand-computing period math for every `BY*`
// combination the corpus exercises), while staying at the original narrow 2
// days for any file dense enough (`SECONDLY`/`MINUTELY`/`HOURLY`) that
// widening it would just trade a vacuous-empty comparison for a
// ceiling-race one instead (see that function's own comment).

const CORPUS_DIR = join(__dirname, 'fixtures/ical-corpus')
const CORPUS_FILES = readdirSync(CORPUS_DIR)
	.filter((name) => name.endsWith('.ics'))
	.sort()

const NARROW_CORPUS_WINDOW_DAYS = 2
const CORPUS_MAX_ITERATIONS = 1000
const CORPUS_SEED_GAP_PERIODS = 500
const WINDOW_PROBE_MAX_STEPS = 2000

/// Not `FIXED_PERIOD_SECONDS` from `ical.ts` -- that map deliberately
/// excludes MONTHLY/YEARLY (their step isn't a fixed span of time, see that
/// map's own comment), and this one deliberately doesn't add them back in.
/// `seekableRule` never accepts MONTHLY or YEARLY, so `CORPUS_SEED_GAP_PERIODS`
/// past DTSTART buys nothing for them -- no seeding will engage regardless of
/// how far out `now` lands. Falling back to `DAILY`'s period keeps their
/// "seeded" pass's `now` a modest, cheap distance past DTSTART instead: a
/// YEARLY rule with several `BYDAY`/`BYMONTH` matches a year, projected out
/// `CORPUS_SEED_GAP_PERIODS` *years* instead of days, is exactly the naive
/// reference walk this file exists to keep affordable -- caught directly,
/// this was the corpus run's single biggest cost before the fallback did.
const NOMINAL_PERIOD_SECONDS: Record<string, number> = {
	SECONDLY: 1,
	MINUTELY: 60,
	HOURLY: 60 * 60,
	DAILY: 24 * 60 * 60,
	WEEKLY: 7 * 24 * 60 * 60,
}

/// The fastest-changing `RRULE` frequency among `masters`, or `DAILY`'s
/// nominal period if none of them has an `RRULE` at all (an `RDATE`-only or
/// non-recurring master) -- the seeded pass's `now` is placed this many
/// `CORPUS_SEED_GAP_PERIODS` past DTSTART, so the fastest rule in a
/// multi-master file (there are two -- `Bug2912657.ics`, `Bug2916581.ics`)
/// is what sizes the gap, keeping the reference walk's cost bounded
/// regardless of which master is slowest.
function fastestNominalPeriodSeconds(masters: ICAL.Component[]): number {
	let periods = masters.flatMap((master) =>
		master
			.getAllProperties('rrule')
			.map((property) => (property.getFirstValue() as ICAL.Recur).freq)
			.map((freq) => NOMINAL_PERIOD_SECONDS[freq] ?? NOMINAL_PERIOD_SECONDS.DAILY),
	)
	return periods.length > 0 ? Math.min(...periods) : NOMINAL_PERIOD_SECONDS.DAILY
}

function earliestDtstart(masters: ICAL.Component[]): Date {
	let instants = masters.map((master) => referenceToInstant(new ICAL.Event(master).startDate))
	return new Date(Math.min(...instants.map((instant) => instant.getTime())))
}

/// One calendar day before `earliestDtstart(masters)` -- not that instant
/// itself. `parseIcalEvents`'s "not already over" filter (`endOfToday` in
/// `ical.ts`) operates on whole calendar days: an occurrence that starts and
/// ends within the same day as `now` is excluded regardless of `now`'s own
/// time-of-day, because that day is already the "today" the filter is
/// comparing against. Several corpus files' every occurrence sits within a
/// single day of `DTSTART` (`MinutelyCount1.ics`'s six 15-minute-interval
/// occurrences, all inside one hour, say) -- using `DTSTART` itself as `now`
/// made every one of those files vacuous regardless of window, because
/// `DTSTART`'s own occurrence was excluded before the window even mattered.
/// Backing `now` up to the *previous* day sidesteps that: `DTSTART` now falls
/// on a later calendar day than `now`, so it (and anything else that day)
/// survives the filter like a real future event would.
///
/// Only the *unseeded* pass uses this -- `seededNowFor`, below, still anchors
/// its own gap math on `earliestDtstart` itself, unshifted. That gap was
/// tuned (see `longestDurationSeconds`'s own comment) to land a duration-
/// padded seed exactly `SEED_MARGIN_PERIODS` past a borderline case like
/// `Minutely1.ics`'s 9-hour occurrence; subtracting a further day from the
/// anchor before adding that same gap ate directly into that margin and
/// pushed three such files (`Minutely1.ics`, `MinutelyInterval1.ics`,
/// `Secondly1.ics`) back below it, undoing the seeding this corpus most wants
/// to exercise. The one-day pull-back exists to fix a same-day filtering
/// artefact right at `DTSTART`, which only the unseeded pass is close enough
/// to `DTSTART` to ever hit.
///
/// Two days rather than one: host offsets span roughly +14 to -12, so a
/// single day is not enough to clear the whole range, and a one-day pull-back
/// left the corpus-depth counts short of their floor anywhere east of about
/// UTC+10 -- a red suite on a correct parser, depending only on the
/// developer's clock.
function unseededNowFor(masters: ICAL.Component[]): Date {
	return new Date(earliestDtstart(masters).getTime() - 2 * 24 * 60 * 60 * 1000)
}

/// Frequencies dense enough that widening the window to chase a real
/// occurrence for some *other*, slower master in the same file would change
/// this master's own behaviour for the worse: at the original narrow 2-day
/// window, an `HOURLY` file already produces a real (non-ceiling) comparison
/// -- 48 raw candidates, comfortably under `CORPUS_MAX_ITERATIONS`. Widen
/// that same file's window to the ~370 days a `YEARLY` companion master might
/// need, and the same `HOURLY` master now needs ~8,880 iterations to reach
/// the window edge, blowing the iteration ceiling and turning a real,
/// content-comparing test into a ceiling-race one instead -- trading one
/// shallow-comparison problem (vacuous-empty) for another (ceiling-only).
/// Kept narrow for exactly the files where this trade would fire.
const FAST_FREQUENCIES = new Set(['SECONDLY', 'MINUTELY', 'HOURLY'])

function rruleFreqs(masters: ICAL.Component[]): string[] {
	return masters.flatMap((master) =>
		master
			.getAllProperties('rrule')
			.map((property) => (property.getFirstValue() as ICAL.Recur).freq),
	)
}

/// Wide enough to include a real occurrence, sized directly against the
/// file's own rule rather than a hand-derived period formula. A period
/// formula (period-length × `INTERVAL`) covers a plain `FREQ=YEARLY` or
/// `FREQ=MONTHLY` rule, but not one further restricted by `BY*` parts this
/// corpus specifically exercises: `MonthlyByMonthDay1.ics`
/// (`BYDAY=FR;BYMONTHDAY=13` -- "the next Friday the 13th", which is 164
/// days after this file's own `DTSTART`, not ~31) and `YearlyByMonthDay1.ics`
/// (`INTERVAL=4` combined with a `BYDAY`/`BYMONTHDAY` intersection, whose
/// next match is 4 calendar years out) both need more than their nominal
/// period predicts. Probing `ical.js`'s own iterator directly -- walking
/// forward from `DTSTART` until a candidate lands after `now`, bounded by
/// `WINDOW_PROBE_MAX_STEPS` -- gets this right for any `BY*` combination
/// without reimplementing RFC 5545's own matching rules a second time here.
///
/// A probe that finds nothing within the step budget (an `UNTIL`/`COUNT`-
/// limited master already exhausted by `now`, or -- `YearlyByWeekNo2.ics`/
/// `YearlyByWeekNo3.ics` -- a `BYWEEKNO` rule `ical.js`'s own recurrence
/// engine in this version never produces *any* occurrence for at all, a
/// genuine upstream limitation rather than anything this parser controls)
/// falls back to the narrow window: widening further wouldn't help a rule
/// that has nothing left to find, or that `ical.js` can't expand regardless
/// of how far the window reaches.
function windowDaysFor(masters: ICAL.Component[], now: Date): number {
	if (rruleFreqs(masters).some((freq) => FAST_FREQUENCIES.has(freq))) {
		return NARROW_CORPUS_WINDOW_DAYS
	}

	let widest = NARROW_CORPUS_WINDOW_DAYS
	for (let master of masters) {
		let event = new ICAL.Event(master)
		if (!event.isRecurring()) continue

		let iterator = event.iterator()
		for (let step = 0; step < WINDOW_PROBE_MAX_STEPS; step += 1) {
			let occurrence = iterator.next()
			if (!occurrence) break

			let instant = referenceToInstant(occurrence)
			if (instant.getTime() <= now.getTime()) continue

			let daysUntil = Math.ceil((instant.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
			widest = Math.max(widest, daysUntil + 5)
			break
		}
	}
	return widest
}

/// The longest `DTEND - DTSTART` among `masters` -- `computeSeedTime`
/// subtracts an occurrence's own duration from the elapsed time before
/// flooring it into periods (so an occurrence still running at `now` isn't
/// skipped past), which means a gap that's merely `CORPUS_SEED_GAP_PERIODS`
/// periods past DTSTART can still net out non-positive once a long duration
/// is subtracted back off -- `computeSeedTime` then correctly declines to
/// seed at all. Caught directly: `Minutely1.ics`/`Secondly1.ics` (a 9-hour
/// occurrence) and `MinutelyInterval1.ics` (24-hour) all failed to seed with
/// no duration padding, even though their frequency is exactly what this
/// corpus most wants to exercise seeding on.
function longestDurationSeconds(masters: ICAL.Component[]): number {
	let durations = masters.map((master) => {
		let event = new ICAL.Event(master)
		return (
			(referenceToInstant(event.endDate).getTime() -
				referenceToInstant(event.startDate).getTime()) /
			1000
		)
	})
	return durations.length > 0 ? Math.max(...durations) : 0
}

/// Compares `parseIcalEvents` against the reference walk, treating "both
/// threw specifically because they hit the shared iteration ceiling" as
/// equivalent to deep equality on the results. Any other divergence -- one
/// side throwing while the other doesn't, or either throwing for an
/// unrelated reason -- still fails the test; this only recognises the one
/// failure mode the corpus's genuinely-unbounded `SECONDLY`/`MINUTELY` rules
/// are expected to hit.
function expectEquivalentOrBothCeilinged(
	body: string,
	now: Date,
	windowDays: number,
	maxIterations: number,
): void {
	let actual: WireEvent[] | undefined
	let actualCause: unknown
	try {
		// `maxOccurrences` is given explicitly, and strictly larger than
		// `maxIterations`, so it can never be the thing that throws first --
		// the count of occurrences an event can push is bounded by the count
		// of iterations it took to find them (`tryPush` is called at most once
		// per iteration), and the iteration loop's own ceiling check runs
		// *before* that iteration's `tryPush` call, so it fires at
		// `iterations === maxIterations`, one iteration before a push could
		// ever bring the occurrence count up to that same number. `+ 1` here
		// (not `maxIterations` itself, which this comparison used to pass)
		// closes that off exactly rather than by margin: at
		// `maxOccurrences === maxIterations`, a rule where literally every
		// iteration produces a push reaches the occurrence count on the very
		// iteration that would otherwise have hit the iteration ceiling next,
		// so the two ceilings race -- `parseIcalEvents` would throw
		// `RecurrenceOccurrenceCeilingError` while the reference walk (which
		// has no occurrence cap at all) keeps going, diverging on error type
		// alone. Left to its production default (`windowDays * 24 * 2`, sized
		// for an HOURLY-scale rule) instead of either injected value, a dense
		// `MINUTELY` rule in this corpus would hit *that* cap first -- a real
		// production behaviour, but not the one this comparison means to
		// exercise.
		actual = parseIcalEvents(body, now, {
			windowDays,
			maxIterations,
			maxOccurrences: maxIterations + 1,
		})
	} catch (error) {
		actualCause = (error as Error).cause
	}

	let expected: WireEvent[] | undefined
	let expectedCause: unknown
	try {
		expected = referenceParseIcalEvents(body, now, windowDays, maxIterations)
	} catch (error) {
		expectedCause = (error as Error).cause
	}

	if (actual === undefined || expected === undefined) {
		expect(actual).toBeUndefined()
		expect(expected).toBeUndefined()
		expect(actualCause).toBeInstanceOf(RecurrenceIterationCeilingError)
		expect(expectedCause).toBeInstanceOf(ReferenceIterationCeilingError)
		return
	}

	expect(actual).toStrictEqual(expected)
}

interface CorpusCase {
	file: string
	body: string
	masters: ICAL.Component[]
}

const CORPUS_CASES: CorpusCase[] = CORPUS_FILES.map((file) => {
	let body = readFileSync(join(CORPUS_DIR, file), 'utf8')
	let masters = ICAL.Component.fromString(body)
		.getAllSubcomponents('vevent')
		.filter((vevent) => !vevent.hasProperty('recurrence-id'))
	return {file, body, masters}
})

/// Whether any master in `masters` would actually take the seeded fast path
/// for *some* `now` -- i.e. `seekableRule` accepts its shape at all, which
/// (unlike `computeSeedTime`'s own age check) doesn't depend on `now`.
/// `seededNowFor` uses this to decide whether pushing `now` out by
/// `CORPUS_SEED_GAP_PERIODS` periods is worth what it costs: for a file with
/// no seekable master (every rule is `COUNT`-limited, or `MONTHLY`/`YEARLY`,
/// or there's no `RRULE` at all), no `now` makes seeding engage, so pushing
/// `now` out that far buys nothing -- and, for a small-`COUNT` rule
/// especially, actively costs something: `CORPUS_SEED_GAP_PERIODS` periods
/// out is almost certainly past that rule's own last occurrence, making an
/// otherwise-comparable file vacuous for no reason. `DailyCount1.ics`
/// (`COUNT=10;INTERVAL=2`, exhausted 18 days after `DTSTART`) was exactly
/// this case before this check existed.
function anySeekable(masters: ICAL.Component[]): boolean {
	return masters.some((master) => {
		let event = new ICAL.Event(master)
		return event.isRecurring() && seekableRule(event.component) !== undefined
	})
}

function seededNowFor({masters}: CorpusCase): Date {
	if (!anySeekable(masters)) return unseededNowFor(masters)

	let gapSeconds =
		CORPUS_SEED_GAP_PERIODS * fastestNominalPeriodSeconds(masters) + longestDurationSeconds(masters)
	return new Date(earliestDtstart(masters).getTime() + gapSeconds * 1000)
}

describe.each(CORPUS_CASES)('corpus: $file', ({file, body, masters}) => {
	test('matches the naive reference walk, unseeded (now the day before the file’s own DTSTART)', () => {
		let now = unseededNowFor(masters)
		expectEquivalentOrBothCeilinged(body, now, windowDaysFor(masters, now), CORPUS_MAX_ITERATIONS)
	})

	test('matches the naive reference walk, seeded (now well past DTSTART)', () => {
		let now = seededNowFor({file, body, masters})
		expectEquivalentOrBothCeilinged(body, now, windowDaysFor(masters, now), CORPUS_MAX_ITERATIONS)
	})
})

// Same rationale as the synthetic cases' own version of this test: a
// deep-equality pass proves the seeded and unseeded paths agree, not that
// any given corpus file actually reached the seeded path at all. This
// counts, across the whole corpus, how many master VEVENTs the seeded
// pass's own `now` actually seeds (via the real `seekableRule`/
// `computeSeedTime`, not a re-implementation) -- so a future change that
// narrows `seekableRule` enough to stop qualifying most of this corpus
// shows up here as a falling count, not as a silently-still-green suite.
test('a meaningful share of the corpus actually takes the seeded path', () => {
	let totalSeeded = CORPUS_CASES.reduce(
		(sum, corpusCase) => sum + seededMasterCount(corpusCase.body, seededNowFor(corpusCase)),
		0,
	)
	expect(totalSeeded).toBeGreaterThanOrEqual(19)
})

// --- Corpus depth: policing against a return to vacuous comparisons -------
//
// `totalSeeded`, just above, counts master VEVENTs that take the seeded
// path -- it says nothing about whether the *comparison* those masters take
// part in ever produces real content. Before `windowDaysFor` and the
// `earliestDtstart`/`seededNowFor` changes above this section, a direct
// count showed 95 of these 140 file/pass combinations compared `[] === []`:
// two empty arrays agree trivially, so a regression that broke real content
// entirely (while leaving both sides equally, silently empty) would have
// passed every assertion in this file. Only 8 combinations both engaged
// seeding *and* compared non-empty output -- the rest of "a meaningful share
//... takes the seeded path" was seeding with nothing behind it to prove that
// seeding agrees with anything.
//
// This block recomputes both counts against the fixed windowing and asserts
// them directly, the same way `totalSeeded` above is asserted rather than
// just relied on in a comment -- so a future change that quietly widens
// `NARROW_CORPUS_WINDOW_DAYS`'s reach, narrows `windowDaysFor`'s probe, or
// otherwise regresses coverage back toward vacuous comparisons fails here,
// rather than leaving a still-green suite that no longer proves anything.

interface CorpusDepth {
	nonEmptyCount: number
	seededAndNonEmptyCount: number
}

function measureCorpusDepth(): CorpusDepth {
	let nonEmptyCount = 0
	let seededAndNonEmptyCount = 0

	for (let corpusCase of CORPUS_CASES) {
		for (let now of [unseededNowFor(corpusCase.masters), seededNowFor(corpusCase)]) {
			let windowDays = windowDaysFor(corpusCase.masters, now)
			let seeded = seededMasterCount(corpusCase.body, now)

			let result: WireEvent[] | undefined
			try {
				result = parseIcalEvents(corpusCase.body, now, {
					windowDays,
					maxIterations: CORPUS_MAX_ITERATIONS,
					maxOccurrences: CORPUS_MAX_ITERATIONS + 1,
				})
			} catch {
				// A ceiling throw (or any other failure) contributes nothing to
				// "non-empty" -- already policed as pass/fail by
				// `expectEquivalentOrBothCeilinged` in the `describe.each` above;
				// this block only measures depth among the comparisons that
				// actually produce a result.
				continue
			}

			if (result.length === 0) continue
			nonEmptyCount += 1
			if (seeded > 0) seededAndNonEmptyCount += 1
		}
	}

	return {nonEmptyCount, seededAndNonEmptyCount}
}

// The 12 combinations that stay vacuous even after `windowDaysFor` and the
// `now` fixes above, and why -- each is a genuine "nothing to compare"
// rather than a coverage gap this file could still close cheaply:
//
//   - `Secondly1.ics` (both passes): an uncapped `SECONDLY` rule hits the
//     shared iteration ceiling before reaching either window edge, on both
//     the parser and the reference walk -- the corpus's documented "both
//     sides fail the same way" case (see the section comment up top), not a
//     vacuous comparison; `expectEquivalentOrBothCeilinged` already asserts
//     the two ceiling errors match, so this is real coverage, just not
//     content coverage.
//   - `YearlyByWeekNo2.ics`/`YearlyByWeekNo3.ics` (both passes): confirmed
//     directly against `ical.js`'s own `Recur#iterator` -- a bare
//     `FREQ=YEARLY;BYWEEKNO=N` rule never produces a single occurrence in
//     this version of the library, for any `DTSTART`. Both this parser and
//     the reference walk sit on the same `ical.js` recurrence engine, so
//     both agree the series is empty -- correctly, given the dependency's
//     own behaviour, even though that behaviour is itself an upstream gap.
//   - `Bug2912657.ics`, `DailyUntil1.ics`, `HourlyUntil1.ics`,
//     `WeeklyUntil1.ics` (seeded pass only): each rule is genuinely
//     exhausted (past its own `UNTIL`, or -- `Bug2912657.ics` -- a small
//     `COUNT`) well before `CORPUS_SEED_GAP_PERIODS` periods past `DTSTART`.
//     `windowDaysFor`'s probe correctly finds nothing to widen the window
//     for, because there is nothing left: this is what "the rule really has
//     no more occurrences" looks like, not what "the window missed one"
//     looks like. The *unseeded* pass for the same files still compares real
//     content, so this isn't a coverage gap for the file overall -- only for
//     a `now` deliberately placed past where these particular rules end.
test('the corpus compares real, non-empty content far more often than it did before windowDaysFor', () => {
	let {nonEmptyCount, seededAndNonEmptyCount} = measureCorpusDepth()

	// 140 total combinations; 12 stay vacuous for the documented reasons
	// above, so 128 is the ceiling this could reach without addressing one of
	// those (an upstream `ical.js` fix, or accepting `SECONDLY`'s ceiling
	// race as a passing "non-empty" case, which it deliberately isn't).
	expect(nonEmptyCount).toBeGreaterThanOrEqual(120)

	// Measured at 11, up from 8 before `windowDaysFor` -- every seekable
	// master's seeded comparison should, now, actually be checking something.
	expect(seededAndNonEmptyCount).toBeGreaterThanOrEqual(10)
})
