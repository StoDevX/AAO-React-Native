import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {addDays, endOfDay, isAfter, isBefore, startOfDay} from 'date-fns'
import ICAL from 'ical.js'
import {computeSeedTime, parseIcalEvents, seekableRule} from '../parsers/ical'
import type {WireEvent} from '../parsers/tec-events'

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
	let startIso = referenceToInstant(startTime).toISOString()
	let endIso = referenceToInstant(endTime).toISOString()
	let descriptionHtml = item.description ?? ''

	return {
		dataSource: 'ical',
		startTime: startIso,
		endTime: endIso,
		title: item.summary ?? '',
		description: fastGetTrimmedText(descriptionHtml),
		location: item.location ?? '',
		isOngoing: isBefore(new Date(startIso), startOfDay(now)),
		links: referenceLinksIn(descriptionHtml),
		config: {
			startTime: true,
			endTime: true,
			subtitle: 'location',
		},
	}
}

/// Walks every occurrence of `event` from its true `DTSTART` -- never seeded
/// closer to `now`, never iteration-capped -- applying overrides and EXDATE
/// along the way, and keeping whatever lands inside the window.
function referenceExpandOccurrences(event: ICAL.Event, now: Date, windowDays: number): WireEvent[] {
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

	// The naive part: no seed, no cap. Every candidate occurrence from
	// DTSTART is walked and thrown away until the window is reached.
	let iterator = event.iterator()
	for (;;) {
		let occurrence = iterator.next()
		if (!occurrence) break
		if (!referenceIsIcalTime(occurrence)) continue
		if (isAfter(referenceToInstant(occurrence), windowEnd)) break
		tryPush(occurrence)
	}

	return occurrences
}

function referenceParseIcalEvents(body: string, now: Date, windowDays: number): WireEvent[] {
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

	let events = masters.flatMap((vevent) => {
		let uid = vevent.getFirstPropertyValue('uid')
		let overrides = (typeof uid === 'string' && overridesByUid.get(uid)) || []
		let event = new ICAL.Event(vevent, {
			exceptions: overrides.map((override) => new ICAL.Event(override)),
			strictExceptions: true,
		})
		return referenceExpandOccurrences(event, now, windowDays)
	})

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
