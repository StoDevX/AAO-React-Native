import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseIcalEvents} from '../parsers/ical'

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

test('the live fixture is entirely in the past and returns no upcoming events', () => {
	// The fixture is a trimmed capture of KSTO's real 2019 show schedule --
	// every event in it predates any reasonable test "now", so a future-only
	// parse of it is the "all past" case, not a parsing failure.
	expect(parseIcalEvents(fixture, NOW)).toStrictEqual([])
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

test('strips html from the description and keeps its links', () => {
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
