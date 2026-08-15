import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseIcalEvents} from '../parsers/ical'

// `parseIcalEvents` buckets occurrences by calendar day (via date-fns'
// `startOfDay`/`endOfDay`), which reads the process's local time zone --
// deliberately, since "today" for a calendar screen means the viewer's own
// day. Jest does not let a test file repoint that after the worker's V8
// realm has started (`process.env.TZ = 'UTC'` here is silently ignored), so
// rather than fight it, every fixed time literal below keeps a two-day (or
// wider) margin from the two day-granularity boundaries this parser applies
// (today, and the 90-day window edge) -- comfortably more than the widest
// possible gap between two real UTC offsets (-12 to +14, i.e. up to 26
// hours), so these assertions hold no matter which time zone runs them.
const fixture = readFileSync(join(__dirname, 'fixtures/ical.ics'), 'utf8')
const outlookFixture = readFileSync(join(__dirname, 'fixtures/ical-microsoft-outlook.ics'), 'utf8')
const appleFixture = readFileSync(join(__dirname, 'fixtures/ical-apple-calendar.ics'), 'utf8')

const NOW = new Date('2026-08-15T12:00:00Z')

function calendar(vevents: string): string {
	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
${vevents}
END:VCALENDAR
`
}

test('the live fixture expands its weekly recurrences into a substantial number of upcoming events', () => {
	// The fixture is a trimmed capture of KSTO's real show schedule: 6 events,
	// each FREQ=WEEKLY with no UNTIL, dated back to 2019. Expanded across the
	// 90-day window from NOW, that's 76 or 77 upcoming occurrences depending
	// on the runner's local time zone (a small number of occurrences sit
	// right at the "is this today or already past" boundary) -- computed
	// directly against the fixture with ical.js, independent of this parser.
	// Either way it is nowhere near the old "0 events" behaviour this test
	// exists to catch a regression back to.
	const events = parseIcalEvents(fixture, NOW)

	expect(events.length).toBeGreaterThanOrEqual(70)
	expect(events.length).toBeLessThanOrEqual(80)
	expect(new Set(events.map((event) => event.title))).toStrictEqual(
		new Set([
			'Pending Review',
			'Rage Brigade',
			'Anti-Facade',
			'Deja Crew',
			'Lost in the Sauce',
			'AnnaSophia Robb',
		]),
	)

	// No occurrence past the 90-day window (with a day's slack either side,
	// since `addDays` -- like the day-boundary math above -- resolves in the
	// runner's local time zone too).
	const windowEnd = new Date(NOW.getTime() + 91 * 24 * 60 * 60 * 1000)
	for (const event of events) {
		expect(new Date(event.startTime).getTime()).toBeLessThanOrEqual(windowEnd.getTime())
	}

	// Spot-check one instance, safely in the middle of the window (clear of
	// both boundaries above) and across the fixture's embedded
	// America/Chicago VTIMEZONE.
	const pendingReviews = events.filter((event) => event.title === 'Pending Review')
	expect(pendingReviews.map((event) => event.startTime)).toContain('2026-09-14T02:00:00.000Z')
})

test('parses a timed event', () => {
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:timed@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Timed event
END:VEVENT`),
		NOW,
	)

	expect(event.dataSource).toBe('ical')
	expect(event.startTime).toBe('2026-09-01T13:00:00.000Z')
	expect(event.endTime).toBe('2026-09-01T14:00:00.000Z')
	expect(event.title).toBe('Timed event')
	expect(event.config).toStrictEqual({startTime: true, endTime: true, subtitle: 'location'})
})

test('a non-recurring event yields exactly one occurrence', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:single@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Single event
END:VEVENT`),
		NOW,
	)

	expect(events).toHaveLength(1)
})

test('parses an all-day event', () => {
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:allday@test
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260902
SUMMARY:All day event
END:VEVENT`),
		NOW,
	)

	expect(event.startTime).toBe('2026-09-01T00:00:00.000Z')
	expect(event.endTime).toBe('2026-09-02T00:00:00.000Z')
})

test('resolves a TZID time to its true UTC instant regardless of the embedded zone', () => {
	// America/Chicago is UTC-5 (CDT) on 2026-09-01, so 13:00 local is 18:00Z --
	// not 13:00Z (treating the wall-clock string as if it were already UTC)
	// and not whatever the host's own local zone would produce.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VTIMEZONE
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
BEGIN:VEVENT
UID:tz@test
DTSTART;TZID=America/Chicago:20260901T130000
DTEND;TZID=America/Chicago:20260901T140000
SUMMARY:TZ event
END:VEVENT`),
		NOW,
	)

	expect(event.startTime).toBe('2026-09-01T18:00:00.000Z')
	expect(event.endTime).toBe('2026-09-01T19:00:00.000Z')
})

test('treats a missing description as empty, not a failure', () => {
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:nodesc@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:No description
END:VEVENT`),
		NOW,
	)

	expect(event.description).toBe('')
	expect(event.links).toStrictEqual([])
})

test('strips html from the description and keeps its anchor links', () => {
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:link@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Has a link
DESCRIPTION:See <a href="https://stolaf.edu/x">this</a> for details.
LOCATION:Somewhere
END:VEVENT`),
		NOW,
	)

	expect(event.description).not.toContain('<')
	expect(event.description).toContain('See this for details.')
	expect(event.links).toStrictEqual(['https://stolaf.edu/x'])
	expect(event.location).toBe('Somewhere')
})

test('finds a bare URL in a plain-text description, not just anchor hrefs', () => {
	// RFC 5545 DESCRIPTION is plain text -- most real feeds have no HTML in
	// it at all, so a URL sitting in the text with no <a> around it is the
	// common case, not the exception.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:bareurl@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Has a bare link
DESCRIPTION:Tickets at https://stolaf.edu/tickets today.
END:VEVENT`),
		NOW,
	)

	expect(event.links).toStrictEqual(['https://stolaf.edu/tickets'])
})

test('trims sentence punctuation and a wrapping parenthesis off bare URLs', () => {
	// A bare URL has no delimiter marking where it ends, so a period closing
	// the sentence or a paren wrapping a parenthetical link reads as part of
	// the match unless it's explicitly trimmed back off -- and a URL with a
	// trailing "." or ")" is a dead link when tapped.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:punctuation@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Punctuated links
DESCRIPTION:Go to https://stolaf.edu/a. Or (https://stolaf.edu/b)
END:VEVENT`),
		NOW,
	)

	expect(event.links).toStrictEqual(['https://stolaf.edu/a', 'https://stolaf.edu/b'])
})

test('filters out a past event', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:past@test
DTSTART:20200101T130000Z
DTEND:20200101T140000Z
SUMMARY:Past event
END:VEVENT`),
		NOW,
	)

	expect(events).toStrictEqual([])
})

test('returns an empty list when every event is legitimately past, without throwing', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:past1@test
DTSTART:20200101T130000Z
DTEND:20200101T140000Z
SUMMARY:Past one
END:VEVENT
BEGIN:VEVENT
UID:past2@test
DTSTART:20200102T130000Z
DTEND:20200102T140000Z
SUMMARY:Past two
END:VEVENT`),
		NOW,
	)

	expect(events).toStrictEqual([])
})

test('drops a malformed VEVENT while keeping its siblings', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:missing-dtstart@test
SUMMARY:No start time
END:VEVENT
BEGIN:VEVENT
UID:good@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Good event
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).toStrictEqual(['Good event'])
})

test('throws when every event in a non-empty calendar is malformed', () => {
	expect(() =>
		parseIcalEvents(
			calendar(`BEGIN:VEVENT
UID:bad1@test
SUMMARY:No start one
END:VEVENT
BEGIN:VEVENT
UID:bad2@test
SUMMARY:No start two
END:VEVENT`),
			NOW,
		),
	).toThrow()
})

test('returns an empty list when the calendar legitimately has no events', () => {
	expect(parseIcalEvents(calendar(''), NOW)).toStrictEqual([])
})

test('throws when the response is not a string', () => {
	expect(() => parseIcalEvents({not: 'a string'})).toThrow()
})

test('sorts events by start time', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:later@test
DTSTART:20260905T130000Z
DTEND:20260905T140000Z
SUMMARY:Later
END:VEVENT
BEGIN:VEVENT
UID:earlier@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Earlier
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).toStrictEqual(['Earlier', 'Later'])
})

test('marks an event as ongoing when its start day is before today', () => {
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:ongoing@test
DTSTART:20260810T130000Z
DTEND:20260901T140000Z
SUMMARY:Ongoing event
END:VEVENT`),
		NOW,
	)

	expect(event.isOngoing).toBe(true)
})

test('expands a weekly recurrence into every occurrence inside the 90-day window and none beyond it', () => {
	// DTSTART sits 3 days after NOW -- clear of the "is this today or already
	// past" boundary in any time zone -- and the rule has no COUNT/UNTIL, so
	// the 90-day window is the only thing bounding it.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:weekly@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Weekly
END:VEVENT`),
		NOW,
	)

	// Computed directly with ical.js against this same rule and NOW, and
	// stable across every time zone from UTC-12 to UTC+14: 13 occurrences,
	// 2026-08-18 through 2026-11-10, the last one nearly 3 days clear of the
	// window edge (~2026-11-13).
	expect(events).toHaveLength(13)
	expect(events[0].startTime).toBe('2026-08-18T13:00:00.000Z')
	expect(events[events.length - 1].startTime).toBe('2026-11-10T13:00:00.000Z')

	// The next occurrence on this schedule, 2026-11-17, is a full week past
	// even the widest possible window edge -- it must not appear.
	expect(events.map((event) => event.startTime)).not.toContain('2026-11-17T13:00:00.000Z')
})

test('EXDATE removes exactly the excluded occurrence, keeping the rest', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:exdate@test
DTSTART:20260822T130000Z
DTEND:20260822T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE:20260829T130000Z
SUMMARY:Weekly with exdate
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-08-22T13:00:00.000Z',
		'2026-09-05T13:00:00.000Z',
		'2026-09-12T13:00:00.000Z',
	])
})

test('a RECURRENCE-ID override changes one occurrence while its siblings stay on the base schedule', () => {
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:override@test
DTSTART:20260822T130000Z
DTEND:20260822T140000Z
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=3
SUMMARY:Base title
END:VEVENT
BEGIN:VEVENT
UID:override@test
RECURRENCE-ID:20260829T130000Z
DTSTART:20260829T150000Z
DTEND:20260829T160000Z
SUMMARY:Override title
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => [event.title, event.startTime])).toStrictEqual([
		['Base title', '2026-08-22T13:00:00.000Z'],
		['Override title', '2026-08-29T15:00:00.000Z'],
		['Base title', '2026-09-05T13:00:00.000Z'],
	])
})

test('a daily rule running since long before any reasonable iteration cap still fills the window', () => {
	// A rule this old (started over a decade before NOW) is exactly the shape
	// that exhausted the old per-event occurrence cap before its walk ever
	// reached the 90-day window: the cap counted every occurrence pulled off
	// the iterator, not just the ones that landed inside the window, so a
	// long-running daily series like a chapel service or a weekday class
	// block converted "successfully" and silently produced zero events.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:longrunning@test
DTSTART:20150101T130000Z
DTEND:20150101T140000Z
RRULE:FREQ=DAILY
SUMMARY:Daily chapel
END:VEVENT`),
		NOW,
	)

	// ~90 days of daily occurrences, give or take the one or two whose
	// "is this today or already past" classification is time-zone-sensitive
	// (see the note on `NOW` above).
	expect(events.length).toBeGreaterThanOrEqual(85)
	expect(events.length).toBeLessThanOrEqual(91)
})

test('a RECURRENCE-ID override moved outside the window drops only that occurrence, not the rest of the series', () => {
	// The override's own DTSTART is a year out -- well past the 90-day
	// window -- while the series it belongs to would otherwise still be
	// producing occurrences every week through mid-November. Only the moved
	// occurrence should disappear from the results.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:moved@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=13
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:moved@test
RECURRENCE-ID:20260901T130000Z
DTSTART:20270901T130000Z
DTEND:20270901T140000Z
SUMMARY:Moved far out
END:VEVENT`),
		NOW,
	)

	// Computed directly against this rule and NOW, stable across every time
	// zone from UTC-12 to UTC+14: the 12 occurrences that stayed on schedule
	// (2026-08-18 through 2026-11-10, skipping the moved 2026-09-01), and
	// none of them titled after the moved-away occurrence.
	expect(events).toHaveLength(12)
	expect(events.map((event) => event.title)).not.toContain('Moved far out')
	expect(events.map((event) => event.startTime)).not.toContain('2026-09-01T13:00:00.000Z')
	expect(events[events.length - 1].startTime).toBe('2026-11-10T13:00:00.000Z')
})

test('a RECURRENCE-ID override moved into the window from beyond it still appears', () => {
	// The mirror of the previous test: here the override's own DTSTART pulls
	// a raw occurrence that would otherwise land well past the 90-day window
	// back into it. The override's RECURRENCE-ID (2026-12-01) is itself
	// beyond the window, so the walk below -- which never runs past
	// `windowEnd` -- never reaches that raw position on its own; this
	// override is found and pushed directly, from its own already-known
	// startDate, before the walk even starts.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:pulledin@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:pulledin@test
RECURRENCE-ID:20261201T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Pulled in
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).toContain('Pulled in')
	expect(events.map((event) => event.startTime)).toContain('2026-09-20T15:00:00.000Z')
	// The occurrence's un-overridden position (2026-12-01) must not also
	// show up under the base title -- it was replaced, not duplicated.
	expect(events.map((event) => event.startTime)).not.toContain('2026-12-01T13:00:00.000Z')
})

test('a beyond-window override at an EXDATE-excluded position is suppressed the same as one inside the window would be', () => {
	// If this override's RECURRENCE-ID sat inside the window instead, the
	// walk would never reach it in the first place -- RecurExpansion drops
	// an EXDATE'd position from the occurrence stream entirely, so no
	// override ever gets a chance to apply there. A beyond-window
	// RECURRENCE-ID has to agree with that: found directly rather than by
	// the walk reaching it, it still shouldn't apply just because it
	// happens to fall on the other side of windowEnd from an otherwise
	// identical in-window case.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:exdatedoverride@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE:20261201T130000Z
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:exdatedoverride@test
RECURRENCE-ID:20261201T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Should not appear
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).not.toContain('Should not appear')
	expect(events.map((event) => event.startTime)).not.toContain('2026-09-20T15:00:00.000Z')
})

test('a RECURRENCE-ID naming a time outside the base rule entirely still applies when beyond the window (documented limitation)', () => {
	// Pinning current, deliberate behaviour rather than an incidental one:
	// this override's RECURRENCE-ID (2030) names a time a COUNT=3 rule
	// never actually produces (its last real occurrence is 2026-09-01) --
	// RFC 5545 requires a RECURRENCE-ID to name an actual instance of the
	// recurrence set, so a real producer wouldn't emit this. If the
	// RECURRENCE-ID were inside the window instead, the walk would simply
	// never reach it (the rule is already exhausted by then), so no
	// override would apply; found directly here, beyond the window, this
	// parser has no cheap way to tell it isn't a real occurrence, so its
	// override still fires. See the comment above the override loop in
	// ical.ts for why this asymmetry is left as-is rather than fixed.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:phantomoverride@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=3
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:phantomoverride@test
RECURRENCE-ID:20300101T130000Z
DTSTART:20260920T150000Z
DTEND:20260920T160000Z
SUMMARY:Phantom occurrence
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).toContain('Phantom occurrence')
	expect(events.map((event) => event.startTime)).toContain('2026-09-20T15:00:00.000Z')
})

test('a far-future override does not blow the iteration ceiling on a long-running dense rule', () => {
	// The regression this guards: an earlier version of the pulled-in-window
	// fix discovered a beyond-window override by extending the walk *past*
	// windowEnd, following the iterator out to the override's own
	// RECURRENCE-ID position -- which, on a rule dense and old enough, could
	// need more steps than the iteration ceiling allows just to get there,
	// regardless of whether the override was ever going to land in the
	// window. The fixed version never walks the iterator to find an override
	// at all: it checks the override's own already-known startDate directly,
	// so a beyond-window override costs zero iterations no matter how far
	// out its RECURRENCE-ID is.
	//
	// This doesn't need the real 300,000-iteration ceiling or an
	// HOURLY-since-2000 rule to prove that -- this file already keeps one
	// such real-scale canary (below) for the ceiling's own headroom, and a
	// second one here would be both redundant (a fixed beyond-window
	// override contributes no iterations to spend against that headroom at
	// all) and the single largest cost in this file, at zero additional
	// regression coverage. A small injected `maxIterations` reproduces the
	// identical mechanism and failure mode (the walk-based approach throwing
	// `RecurrenceIterationCeilingError`, discarding the whole event) far
	// more cheaply: a WEEKLY rule with no COUNT, an override dated nine
	// years out, and a ceiling small enough that walking the iterator to
	// there would exceed it long before a fixed, non-walking lookup would
	// even notice.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:weeklyoverride@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Weekly
END:VEVENT
BEGIN:VEVENT
UID:weeklyoverride@test
RECURRENCE-ID:20350101T130000Z
DTSTART:20260920T130000Z
DTEND:20260920T140000Z
SUMMARY:Pulled in from 2035
END:VEVENT`),
		NOW,
		{maxIterations: 50},
	)

	// 13 occurrences of the base WEEKLY;BYDAY=TU rule inside the 90-day
	// window (matching the "expands a weekly recurrence" test above, same
	// DTSTART and rule) plus the pulled-in override.
	expect(events).toHaveLength(14)
	expect(events.map((event) => event.title)).toContain('Pulled in from 2035')
	expect(events.map((event) => event.startTime)).toContain('2026-09-20T13:00:00.000Z')
})

test('an HOURLY rule fills the entire 90-day window, not just its first stretch', () => {
	// A 90-day window holds 90 * 24 = 2160 hourly occurrences. The old
	// MAX_OCCURRENCES_PER_EVENT = 2000 -- smaller than that -- silently
	// dropped the window's last few days for exactly this shape of rule.
	// This test genuinely walks ~235,000 iterations (from 2000-01-01 to the
	// window) with the *real*, un-injected default limits -- it's kept as
	// this file's one deliberately-real-scale canary, the closest thing here
	// to a plausible real feed, even though every other ceiling/cap test
	// below now runs at a tiny injected scale instead. There's no way to
	// prove the real constants are well chosen without actually reaching
	// them at least once.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:hourly@test
DTSTART:20000101T130000Z
DTEND:20000101T140000Z
RRULE:FREQ=HOURLY
SUMMARY:Hourly
END:VEVENT`),
		NOW,
	)

	// Computed directly against this rule and NOW: 2138-2159 across every
	// time zone from UTC-12 to UTC+14 (hourly granularity means the
	// today/window-edge boundaries this file's other tests keep clear of are
	// unavoidable here). Well above the old 2000 cap either way, and nowhere
	// near the new cap (4320), so this is squarely "the whole window", not
	// "still truncated, just less obviously".
	expect(events.length).toBeGreaterThanOrEqual(2130)
	expect(events.length).toBeLessThanOrEqual(2160)

	// The window runs through ~2026-11-13; the old cap's last occurrence was
	// 2026-11-07. This one should reach within a day of the real edge.
	const lastStart = new Date(events[events.length - 1].startTime)
	expect(lastStart.getTime()).toBeGreaterThan(new Date('2026-11-11T00:00:00Z').getTime())
})

// DTSTART close to NOW: with an injected `maxIterations` this small, even a
// FREQ=MINUTELY rule starting essentially "now" needs vastly more than that
// many steps to reach the (default, un-overridden) 90-day window, so the
// ceiling fires almost immediately regardless of what DTSTART actually is.
const PATHOLOGICAL_MINUTELY_VEVENT = `BEGIN:VEVENT
UID:pathological@test
DTSTART:20260815T120000Z
DTEND:20260815T121000Z
RRULE:FREQ=MINUTELY
SUMMARY:Pathological
END:VEVENT`

test('a rule that exhausts the iteration ceiling is dropped, not rendered as an empty calendar', () => {
	// A tiny injected `maxIterations` (100, versus the real default 300,000)
	// tests the throw-vs-silently-empty *routing* this fix is actually about
	// without needing a genuinely pathological rule and the real ceiling's
	// scale to prove it -- see `parseIcalEvents`'s `limits` parameter.
	const events = parseIcalEvents(
		calendar(`${PATHOLOGICAL_MINUTELY_VEVENT}
BEGIN:VEVENT
UID:healthy@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Healthy
END:VEVENT`),
		NOW,
		{maxIterations: 100},
	)

	expect(events.map((event) => event.title)).toStrictEqual(['Healthy'])
})

test('a rule that exhausts the iteration ceiling throws when it is the only event, instead of returning an empty calendar', () => {
	// This is what actually distinguishes "hitting the ceiling throws" from
	// "hitting the ceiling silently gives up and returns whatever was found
	// so far" -- with a healthy sibling in the calendar (previous test),
	// both designs produce the same visible result (the pathological event
	// contributes nothing either way), so that test alone doesn't prove the
	// ceiling throws rather than merely returning empty. Alone, the two
	// diverge: a silent give-up looks like `successCount` stayed 1 and the
	// calendar legitimately has nothing upcoming; only an actual throw hits
	// the all-malformed guard and surfaces this loudly.
	//
	// The thrown error's own message is swallowed by the per-master catch in
	// favour of the generic "every ical event was malformed" -- otherwise
	// exactly the kind of message a debugging developer needs would be lost.
	// It survives as `.cause`, so this checks that rather than a bare
	// `.toThrow()`.
	expect.assertions(3)
	try {
		parseIcalEvents(calendar(PATHOLOGICAL_MINUTELY_VEVENT), NOW, {maxIterations: 100})
	} catch (error) {
		expect(error).toBeInstanceOf(Error)
		expect((error as Error).message).toBe('every ical event was malformed')
		expect(((error as Error).cause as Error | undefined)?.message).toMatch(
			/exceeded 100 recurrence iterations/u,
		)
	}
})

test('a finite rule whose occurrence count exactly equals the iteration ceiling still returns cleanly', () => {
	// The ceiling used to be checked before calling `iterator.next()`, so a
	// COUNT-bounded rule needing exactly `maxIterations` steps to exhaust
	// itself hit the ceiling check one call early and threw, even though the
	// very next `iterator.next()` would have returned null (the rule is
	// genuinely finished, not still going). All 5 occurrences here are in
	// 2020 -- long past `now` -- so this is also a legitimately empty
	// result, not merely "some events dropped."
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:exactceiling@test
DTSTART:20200101T130000Z
DTEND:20200101T140000Z
RRULE:FREQ=DAILY;COUNT=5
SUMMARY:Exactly at the ceiling
END:VEVENT`),
		NOW,
		{maxIterations: 5},
	)

	expect(events).toStrictEqual([])
})

test('MAX_OCCURRENCES_PER_EVENT derives exactly from windowDays, not an independent number', () => {
	// A FREQ=MINUTELY rule inside a window this small produces far more raw
	// occurrences than any plausible cap (2 days = 2880 minutes, 3 days =
	// 4320), so the count returned is entirely determined by
	// `windowDays * 24 * 2` -- this pins the derivation itself, rather than
	// just showing one number exceeds another the way the HOURLY-since-2000
	// test above does.
	const rule = `BEGIN:VEVENT
UID:dense@test
DTSTART:20260815T120000Z
DTEND:20260815T121000Z
RRULE:FREQ=MINUTELY
SUMMARY:Dense
END:VEVENT`

	const twoDayWindow = parseIcalEvents(calendar(rule), NOW, {windowDays: 2})
	const threeDayWindow = parseIcalEvents(calendar(rule), NOW, {windowDays: 3})

	expect(twoDayWindow).toHaveLength(2 * 24 * 2)
	expect(threeDayWindow).toHaveLength(3 * 24 * 2)
})

test('trims a trailing paren only when it is not part of a balanced URL', () => {
	// The round-2 fix stripped every trailing ")" unconditionally, which
	// broke URLs that legitimately end in one -- a Wikipedia-style article
	// name, or a query string. The usual autolinker rule (keep a trailing
	// ")" if the parens inside the match are balanced) distinguishes those
	// from a ")" that's actually closing the surrounding sentence.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:balanced@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
SUMMARY:Balanced parens
DESCRIPTION:See https://en.wikipedia.org/wiki/Foo_(bar) and https://stolaf.edu/s?q=1&x=(2)
END:VEVENT`),
		NOW,
	)

	expect(event.links).toStrictEqual([
		'https://en.wikipedia.org/wiki/Foo_(bar)',
		'https://stolaf.edu/s?q=1&x=(2)',
	])
})

test('does not pay the description-parsing cost for occurrences the future-only filter would discard anyway', () => {
	// Before this fix, toWireEvent (HTML-stripping + link-scanning the
	// description) ran for every occurrence walked from DTSTART, including
	// the thousands already in the past, only for parseIcalEvents's own
	// future-only filter to throw almost all of that work away moments
	// later. Checking the today-or-later condition before building the wire
	// event, not after, means only the ~90 occurrences actually inside the
	// window ever reach that cost.
	//
	// An absolute wall-clock ceiling is hardware-dependent: a CI runner
	// meaningfully slower than the machine this was tuned on could fail a
	// passing implementation. Comparing against a same-shape baseline
	// (the identical rule with DESCRIPTION removed) measured in the same run
	// instead makes the assertion relative to whatever this machine's speed
	// actually is -- if the fix holds, the two cost about the same (only the
	// ~90 occurrences inside the window ever reach `toWireEvent` either way);
	// broken, the with-description run pays for parsing all ~9700 candidate
	// occurrences instead of just the ~90 that survive.
	//
	// Both shapes are run twice, discarding the first result, before either
	// is timed: Jest's JIT has not warmed up `ical.js`'s hot paths yet on the
	// very first `parseIcalEvents` call in a test, so an unwarmed comparison
	// mostly measures "which one ran first" rather than the cost difference
	// this test cares about -- confirmed directly (reversing which shape ran
	// first flipped which one looked "faster").
	//
	// Measured directly, warmed up, several runs each: fixed lands at
	// roughly 1.0-1.03x its own baseline; the pre-fix ordering (every
	// occurrence converted regardless of date) lands at roughly 2.3-2.4x.
	// 1.8x sits with clear margin on both sides of that gap on this machine,
	// well under the review's own suggested 2.5x -- kept lower deliberately,
	// since 2.5x left as little as ~0.1x of headroom above the broken
	// measurement here.
	//
	// A single sample of each side is still noisy on a shared/loaded CI
	// runner -- a GC pause landing in just the baseline call, say, inflates
	// the ratio with nothing to do with this fix. Taking the best (lowest)
	// of several timed runs per side, after the same warm-up, keeps a single
	// unlucky pause from failing an otherwise-passing implementation while
	// still measuring the real per-occurrence cost this test exists to
	// catch: a regression back to converting every candidate makes *every*
	// with-description run slower, so the best of several still lands near
	// 2.3x, not down near 1.0x.
	const description =
		'<p>Join us for chapel featuring a guest speaker. See <a href="https://stolaf.edu/chapel">the schedule</a> for details.</p>'

	function chapelCalendar(withDescription: boolean): string {
		return calendar(`BEGIN:VEVENT
UID:chapel@test
DTSTART:20000101T130000Z
DTEND:20000101T140000Z
RRULE:FREQ=DAILY
SUMMARY:Daily chapel
${withDescription ? `DESCRIPTION:${description}\n` : ''}END:VEVENT`)
	}

	function bestOf(runs: number, run: () => void): number {
		let best = Infinity
		for (let i = 0; i < runs; i += 1) {
			let start = Date.now()
			run()
			best = Math.min(best, Date.now() - start)
		}
		return best
	}

	parseIcalEvents(chapelCalendar(false), NOW)
	parseIcalEvents(chapelCalendar(true), NOW)

	const RUNS_PER_SIDE = 3
	const baselineMs = bestOf(RUNS_PER_SIDE, () => parseIcalEvents(chapelCalendar(false), NOW))
	let events: ReturnType<typeof parseIcalEvents> = []
	const elapsedMs = bestOf(RUNS_PER_SIDE, () => {
		events = parseIcalEvents(chapelCalendar(true), NOW)
	})

	expect(events.length).toBeGreaterThan(0)
	expect(elapsedMs).toBeLessThan(baselineMs * 1.8)
})

// The tests below establish behaviour for RFC 5545 shapes the fixture and
// the tests above never exercise -- a Google Calendar export doesn't use
// DURATION, RDATE, or floating times, and none of the existing EXDATE/
// all-day/straddling-window tests combine those particular ways. Each one
// was run against the parser *before* any fix was made, specifically to
// find out whether ical.js already handles the shape correctly (most do) or
// silently drops something (the RDATE-only case did).

test('DTSTART plus DURATION computes the same end time as an equivalent DTEND', () => {
	// Standard in Exchange/Outlook exports, which favour DURATION over an
	// explicit DTEND. Already correct: ical.js's own `Event#endDate` getter
	// falls back to `dtstart + duration` when there's no `DTEND` property.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:duration@test
DTSTART:20260901T130000Z
DURATION:PT2H
SUMMARY:Duration event
END:VEVENT`),
		NOW,
	)

	expect(event.startTime).toBe('2026-09-01T13:00:00.000Z')
	expect(event.endTime).toBe('2026-09-01T15:00:00.000Z')
})

test('DTSTART with neither DTEND nor DURATION is zero-length for a DATE-TIME', () => {
	// RFC 5545 3.6.1: with neither property present, a DATE-TIME DTSTART
	// implies the same instant (zero duration). Already correct: ical.js's
	// `endDate` getter falls back to `startDate.clone()` unmodified when
	// there's no DURATION and the start isn't a DATE.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:noduration@test
DTSTART:20260901T130000Z
SUMMARY:No duration
END:VEVENT`),
		NOW,
	)

	expect(event.startTime).toBe(event.endTime)
	expect(event.startTime).toBe('2026-09-01T13:00:00.000Z')
})

test('DTSTART with neither DTEND nor DURATION implies one day for an all-day DATE', () => {
	// RFC 5545 3.6.1: with neither property present, a DATE-valued DTSTART
	// implies a one-day event. Already correct: ical.js's `endDate` getter
	// adds a day to the clone when the start `isDate` and there's no
	// DURATION.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:nodurationallday@test
DTSTART;VALUE=DATE:20260901
SUMMARY:No duration, all day
END:VEVENT`),
		NOW,
	)

	expect(event.startTime).toBe('2026-09-01T00:00:00.000Z')
	expect(event.endTime).toBe('2026-09-02T00:00:00.000Z')
})

test('RDATE alone (no RRULE) still includes DTSTART itself as an occurrence', () => {
	// This one was genuinely broken: `Event#isRecurring()` does treat an
	// RDATE-only event as recurring (it checks for either `rrule` or
	// `rdate`), so the two RDATE-named occurrences were never at risk of
	// being silently dropped. But `ical.js`'s `RecurExpansion` only ever
	// emits DTSTART itself as an occurrence when the series has an RRULE --
	// an RDATE-only series walked straight to the two RDATE values and
	// skipped the series' own first (DTSTART) occurrence entirely, even
	// though RFC 5545 3.8.5.2/3.8.5.3 count DTSTART as always being part of
	// the recurrence set. `needsInjectedDtstart` in the parser compensates.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:rdateonly@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE:20260908T130000Z,20260915T130000Z
SUMMARY:RDATE only
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-09-01T13:00:00.000Z',
		'2026-09-08T13:00:00.000Z',
		'2026-09-15T13:00:00.000Z',
	])
})

test('an EXDATE naming the DTSTART of an RDATE-only series excludes it, day-truncated the same as any other EXDATE', () => {
	// A `DATE`-valued EXDATE against a `DATE-TIME` occurrence excludes by
	// calendar day, not exact instant -- `ical.js` applies this truncation
	// itself for every occurrence it evaluates EXDATE against (an RDATE
	// value, say). The injected DTSTART above is the one occurrence `ical.js`
	// never evaluates EXDATE against at all, so without the same truncation
	// here, a `DATE`-valued EXDATE naming DTSTART's day would exclude an
	// RDATE occurrence on that day but leave DTSTART itself untouched --
	// two different rules for what should be the same EXDATE.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:exdatetruncatesdtstart@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE:20260908T130000Z,20260915T130000Z
EXDATE;VALUE=DATE:20260901
SUMMARY:Exdate excludes DTSTART
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-09-08T13:00:00.000Z',
		'2026-09-15T13:00:00.000Z',
	])
})

test('an RDATE that repeats DTSTART does not duplicate it', () => {
	// Some producers list DTSTART in RDATE explicitly, even though RFC 5545
	// already counts it as part of the recurrence set on its own. Without
	// checking for this, the DTSTART-injection fix above would add a second,
	// duplicate occurrence at the same instant `ical.js`'s own RDATE walk
	// already produces.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:rdaterepeatsdtstart@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE:20260901T130000Z,20260908T130000Z
SUMMARY:Rdate repeats dtstart
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-09-01T13:00:00.000Z',
		'2026-09-08T13:00:00.000Z',
	])
})

test('an RDATE;VALUE=PERIOD occurrence is dropped without losing the rest of its own event or its siblings', () => {
	// RDATE is the one date-valued property RFC 5545 allows a VALUE=PERIOD
	// form for -- an explicit (start, duration) pair rather than a single
	// instant. ical.js's RecurExpansion happily mixes the resulting
	// ICAL.Period values into the same occurrence stream as ICAL.Time values,
	// but this parser only handles Time (toInstant, getOccurrenceDetails, and
	// toWireEvent all expect Time-only methods). Full PERIOD support is out
	// of scope here; what matters is that hitting one doesn't crash the walk
	// and take the rest of the event's own occurrences (its injected DTSTART,
	// here) or an unrelated sibling event down with it.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:perioddate@test
DTSTART:20260901T130000Z
DTEND:20260901T140000Z
RDATE;VALUE=PERIOD:20260908T130000Z/PT2H
SUMMARY:Period rdate
END:VEVENT
BEGIN:VEVENT
UID:sibling@test
DTSTART:20260910T130000Z
DTEND:20260910T140000Z
SUMMARY:Unaffected sibling
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.title)).toStrictEqual(['Period rdate', 'Unaffected sibling'])
	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-09-01T13:00:00.000Z',
		'2026-09-10T13:00:00.000Z',
	])
})

test('RDATE alongside an RRULE adds an extra occurrence on top of the rule', () => {
	// Already correct: `RecurExpansion` merges its `ruleDates` (from RDATE)
	// with its rule iterators' output, in date order, without special-casing
	// either source.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:rdatewithrule@test
DTSTART:20260818T130000Z
DTEND:20260818T140000Z
RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=3
RDATE:20260825T180000Z
SUMMARY:RDATE plus rule
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-08-18T13:00:00.000Z',
		'2026-08-25T13:00:00.000Z',
		'2026-08-25T18:00:00.000Z',
		'2026-09-01T13:00:00.000Z',
	])
})

test('EXDATE with a TZID excludes the matching occurrence', () => {
	// The existing EXDATE test uses a plain UTC date-time only. Already
	// correct: `RecurExpansion` extracts EXDATE the same way regardless of
	// whether it carries a TZID, and `Time#compare` resolves both sides to
	// the same absolute instant before comparing.
	const events = parseIcalEvents(
		calendar(`BEGIN:VTIMEZONE
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
BEGIN:VEVENT
UID:exdatetzid@test
DTSTART;TZID=America/Chicago:20260822T080000
DTEND;TZID=America/Chicago:20260822T090000
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE;TZID=America/Chicago:20260829T080000
SUMMARY:Exdate with TZID
END:VEVENT`),
		NOW,
	)

	expect(events).toHaveLength(3)
	expect(events.map((event) => event.startTime)).not.toContain('2026-08-29T13:00:00.000Z')
})

test('an EXDATE with a DATE value excludes the matching occurrence of an all-day series', () => {
	// Already correct: `RecurExpansion`'s `_compare_special` truncates a
	// DATE-TIME occurrence to its calendar date before comparing against a
	// DATE-valued EXDATE, but here both sides are already DATE-valued (the
	// series is all-day), so it's a plain date compare either way.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:exdateallday@test
DTSTART;VALUE=DATE:20260822
DTEND;VALUE=DATE:20260823
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
EXDATE;VALUE=DATE:20260829
SUMMARY:Exdate allday
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => event.startTime)).toStrictEqual([
		'2026-08-22T00:00:00.000Z',
		'2026-09-05T00:00:00.000Z',
		'2026-09-12T00:00:00.000Z',
	])
})

test('an all-day series recurs correctly, one whole day per occurrence', () => {
	// Already correct: `toInstant`'s all-day branch (UTC midnight from the
	// calendar-date fields) applies uniformly to every occurrence the
	// iterator produces, not just to a non-recurring event's own DTSTART.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:alldayrecur@test
DTSTART;VALUE=DATE:20260822
DTEND;VALUE=DATE:20260823
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=4
SUMMARY:Allday recur
END:VEVENT`),
		NOW,
	)

	expect(events.map((event) => [event.startTime, event.endTime])).toStrictEqual([
		['2026-08-22T00:00:00.000Z', '2026-08-23T00:00:00.000Z'],
		['2026-08-29T00:00:00.000Z', '2026-08-30T00:00:00.000Z'],
		['2026-09-05T00:00:00.000Z', '2026-09-06T00:00:00.000Z'],
		['2026-09-12T00:00:00.000Z', '2026-09-13T00:00:00.000Z'],
	])
})

test('a multi-day event that starts before now and ends inside the window still appears', () => {
	// Already correct: a non-recurring event has no "starts before the
	// window" filter at all in `expandOccurrences` -- only
	// `parseIcalEvents`'s own future-only filter (keyed on `endTime`, not
	// `startTime`) applies, and this event's `endTime` is comfortably in
	// the future.
	const events = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:straddle@test
DTSTART:20260801T130000Z
DTEND:20260901T140000Z
SUMMARY:Straddling the window edge
END:VEVENT`),
		NOW,
	)

	expect(events).toHaveLength(1)
	expect(events[0].startTime).toBe('2026-08-01T13:00:00.000Z')
	expect(events[0].endTime).toBe('2026-09-01T14:00:00.000Z')
	expect(events[0].isOngoing).toBe(true)
})

test('a floating DTSTART (no TZID, no trailing Z) resolves in the host process time zone', () => {
	// Already correct, by design rather than accident: `ICAL.Time#toJSDate`
	// resolves a floating time (zone === Timezone.localTimezone) against the
	// host's own local wall-clock fields -- which is the RFC 5545-correct
	// reading of a floating time for a viewer in that zone. `toInstant` only
	// special-cases the all-day (`VALUE=DATE`) case; a floating DATE-TIME
	// falls through to this same `toJSDate` behaviour.
	const [event] = parseIcalEvents(
		calendar(`BEGIN:VEVENT
UID:floating@test
DTSTART:20260901T130000
DTEND:20260901T140000
SUMMARY:Floating
END:VEVENT`),
		NOW,
	)

	// The floating wall-clock time (13:00) read as the test runner's own
	// local zone, then converted to UTC -- i.e. whatever `new Date(2026, 8,
	// 1, 13, 0, 0)` produces on this machine. Not asserting a fixed UTC
	// offset here since that's the point: it's host-zone-dependent by
	// definition.
	const expected = new Date(2026, 8, 1, 13, 0, 0)
	expect(new Date(event.startTime).getTime()).toBe(expected.getTime())
})

// The committed KSTO fixture is a Google Calendar export. Real feeds from
// other producers format meaningfully differently -- different VTIMEZONE
// conventions, different (or absent) SUMMARY handling, quoted parameter
// values -- so a parser that only ever sees Google's shape could have
// producer-specific bugs no test here would catch.

test('parses a real Microsoft Outlook/Exchange export', () => {
	// Captured, not hand-written: `Ical.Net.Tests/Calendars/Recurrence/
	// Bug2966236.ics` from the ical.net project (github.com/ical-org/
	// ical.net), a real Outlook 11.0 MIMEDIR export attached to a bug
	// report. Kept byte-for-byte as fetched. Notable real-world shapes it
	// exercises that the Google fixture doesn't: a VTIMEZONE with only a
	// STANDARD sub-component (Shanghai hasn't observed DST since 1991, so
	// Outlook emitted no DAYLIGHT block at all), a `TZID` parameter value
	// wrapped in double quotes (legal but unusual), and a VEVENT with no
	// SUMMARY property at all (some Exchange exports omit it).
	const events = parseIcalEvents(outlookFixture, new Date('2026-08-15T12:00:00Z'))

	// FREQ=DAILY;INTERVAL=7 from 2010-01-19 -- weekly-spaced daily
	// occurrences -- landing inside the 90-day window from NOW. Computed
	// directly against this fixture: 13 occurrences, every Tuesday
	// 2026-08-18 through 2026-11-10.
	expect(events.length).toBeGreaterThanOrEqual(12)
	expect(events.length).toBeLessThanOrEqual(14)
	// No SUMMARY in the fixture -- title falls back to '', same as the
	// existing "missing description" test's handling of an absent property.
	expect(events.every((event) => event.title === '')).toBe(true)
	expect(events[0].startTime).toBe('2026-08-18T00:00:00.000Z')
})

test('parses a real Apple Calendar (macOS) export', () => {
	// Captured, not hand-written: from `tests/fixture.py`'s `cal1`
	// (github.com/m42e/ics.py, a fork of the canonical ics.py project --
	// github.com/C4ptainCrunch/ics.py, now hosted at github.com/ics-py/ics-py
	// -- which is where this fixture actually originates), a real macOS 10.9
	// Calendar.app export -- `X-APPLE-CALENDAR-COLOR`, `X-WR-CALNAME`, and a
	// VTIMEZONE using macOS's own "UTC+2"/"UTC+1" `TZNAME`s rather than
	// "CEST"/"CET". The DESCRIPTION is truncated to its first sentence (the
	// original ran another five sentences of the same lorem ipsum) at an
	// exact prefix of the captured text, so its unescaped comma -- a real,
	// technically RFC 5545-noncompliant quirk of this producer's own output,
	// not something introduced here -- is unchanged. Every other property is
	// unmodified from the captured source.
	const [event] = parseIcalEvents(appleFixture, new Date('2013-10-25T12:00:00Z'))

	// Europe/Brussels is CET (UTC+1) on 2013-10-29 -- DST in the fixture's
	// own embedded VTIMEZONE ended 2013-10-27 -- so 10:30 local is 09:30Z.
	expect(event.startTime).toBe('2013-10-29T09:30:00.000Z')
	expect(event.endTime).toBe('2013-10-29T10:30:00.000Z')
	expect(event.title).toBe('dfqsdfjqkshflqsjdfhqs fqsfhlqs dfkqsldfkqsdfqsfqsfqsfs')
	expect(event.description).toBe('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
})
