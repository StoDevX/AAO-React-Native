import fixture from './fixtures/presence-events.json'
import {parsePresenceEvents} from '../parsers/presence'

function event(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		eventName: 'OrgEssentials Training',
		organizationName: 'Office of Student Activities',
		organizationUri: 'office-of-student-activities',
		uri: 'orgessentials-training',
		description: '<p>Annual training.</p>',
		location: 'Viking Theater',
		startDateTimeUtc: '2026-09-09T23:00:00Z',
		endDateTimeUtc: '2026-09-10T00:00:00Z',
		...overrides,
	}
}

test('parses the live fixture', () => {
	expect(parsePresenceEvents(fixture)).toHaveLength(fixture.length)
})

test('maps the event name to the title', () => {
	let [parsed] = parsePresenceEvents([event()])
	expect(parsed.title).toBe('OrgEssentials Training')
})

test('carries the sponsoring organisation', () => {
	let [parsed] = parsePresenceEvents([event()])
	expect(parsed.organization).toBe('Office of Student Activities')
})

test('strips the HTML out of the description', () => {
	let [parsed] = parsePresenceEvents([event({description: '<p>Annual <b>training</b>.</p>'})])
	// fastGetTrimmedText joins text runs split by a tag with a space -- see
	// modules/html-lib/__tests__/remove-html.test.ts -- so the `.` that was
	// its own text node keeps a leading space.
	expect(parsed.description).toBe('Annual training .')
})

test('links to the event page on Presence', () => {
	let [parsed] = parsePresenceEvents([event()])
	expect(parsed.links).toContain('https://stolaf.presence.io/event/orgessentials-training')
})

test('collects links out of the description without repeating the event page', () => {
	let [parsed] = parsePresenceEvents([
		event({description: '<p>See <a href="https://wp.stolaf.edu/sao/">SAO</a>.</p>'}),
	])
	expect(parsed.links).toStrictEqual([
		'https://wp.stolaf.edu/sao/',
		'https://stolaf.presence.io/event/orgessentials-training',
	])
})

test('treats every Presence event as timed, never all-day', () => {
	let [parsed] = parsePresenceEvents([event()])
	expect(parsed.isAllDay).toBe(false)
	expect(parsed.config).toStrictEqual({startTime: true, endTime: true, subtitle: 'location'})
})

test('flags an event spanning more than one day', () => {
	let [parsed] = parsePresenceEvents([
		event({startDateTimeUtc: '2026-10-10T15:30:00Z', endDateTimeUtc: '2026-10-12T21:00:00Z'}),
	])
	expect(parsed.isMultiDay).toBe(true)
})

test('reports an event already under way as ongoing', () => {
	let [parsed] = parsePresenceEvents(
		[event({startDateTimeUtc: '2026-09-07T15:00:00Z', endDateTimeUtc: '2026-09-10T15:00:00Z'})],
		new Date('2026-09-09T12:00:00Z'),
	)
	expect(parsed.isOngoing).toBe(true)
})

test('leaves categories empty -- Presence has none on an event', () => {
	let [parsed] = parsePresenceEvents([event()])
	expect(parsed.categories).toStrictEqual([])
})

test('drops one malformed event rather than the whole feed', () => {
	let parsed = parsePresenceEvents([event(), {eventName: 'No dates'}])
	expect(parsed).toHaveLength(1)
})

test('throws when a body is not an array at all', () => {
	expect(() => parsePresenceEvents({events: []})).toThrow()
})

test('throws when every event in a non-empty feed is malformed', () => {
	expect(() => parsePresenceEvents([{eventName: 'No dates'}])).toThrow(
		'every Presence event was malformed',
	)
})

test('accepts a genuinely empty feed', () => {
	expect(parsePresenceEvents([])).toStrictEqual([])
})
