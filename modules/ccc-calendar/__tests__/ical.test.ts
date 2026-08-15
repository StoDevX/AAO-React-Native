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
