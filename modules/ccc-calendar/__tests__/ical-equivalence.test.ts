import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fastGetTrimmedText, htmlToSegments} from '@frogpond/html-lib'
import {addDays, endOfDay, isAfter, isBefore, startOfDay} from 'date-fns'
import ICAL from 'ical.js'
import {parseIcalEvents} from '../parsers/ical'
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
	},
	{
		name: 'daily',
		body: calendar(`BEGIN:VEVENT
UID:daily@test
DTSTART:20150101T130000Z
DTEND:20150101T140000Z
RRULE:FREQ=DAILY
SUMMARY:Daily
END:VEVENT`),
	},
	{
		name: 'monthly',
		body: calendar(`BEGIN:VEVENT
UID:monthly@test
DTSTART:20180115T130000Z
DTEND:20180115T140000Z
RRULE:FREQ=MONTHLY
SUMMARY:Monthly
END:VEVENT`),
	},
	{
		name: 'yearly',
		body: calendar(`BEGIN:VEVENT
UID:yearly@test
DTSTART:20180301T130000Z
DTEND:20180301T140000Z
RRULE:FREQ=YEARLY
SUMMARY:Yearly
END:VEVENT`),
		windowDays: 3650,
	},
	{
		// Spans both the spring-forward (second Sunday of March) and
		// fall-back (first Sunday of November) DST transitions embedded in
		// the VTIMEZONE above.
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
	},
	{
		name: 'a multi-day event straddling the window edge',
		body: calendar(`BEGIN:VEVENT
UID:straddle@test
DTSTART:20260801T130000Z
DTEND:20261115T140000Z
SUMMARY:Straddling
END:VEVENT`),
	},
]

test.each(SYNTHETIC_CASES)('$name matches the naive reference walk', ({body, now, windowDays}) => {
	expectEquivalentToReference(body, now ?? NOW, windowDays)
})
