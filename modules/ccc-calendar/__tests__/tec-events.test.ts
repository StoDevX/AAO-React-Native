import fixture from './fixtures/tec-events.json'
import {parseTecEvents} from '../parsers/tec-events'

test('parses the live fixture', () => {
	expect(parseTecEvents(fixture).length).toBeGreaterThan(0)
})

test('treats the naive utc timestamp as utc', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'New Faculty Orientation',
				description: '<p>Seminars.</p>',
				url: 'https://wp.stolaf.edu/calendar/event/nfo/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-20 22:00:00',
				venue: {venue: 'Kings Dining'},
			},
		],
	})
	expect(event.startTime).toBe('2026-08-17T13:00:00.000Z')
	expect(event.endTime).toBe('2026-08-20T22:00:00.000Z')
})

test('uses the venue name as the location', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
				venue: {venue: 'Kings Dining'},
			},
		],
	})
	expect(event.location).toBe('Kings Dining')
})

test('tolerates an event with no venue at all', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: true,
				utc_start_date: '2026-08-17 00:00:00',
				utc_end_date: '2026-08-17 23:59:59',
			},
		],
	})
	expect(event.location).toBe('')
})

test('hides the times on an all-day event', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: true,
				utc_start_date: '2026-08-17 00:00:00',
				utc_end_date: '2026-08-17 23:59:59',
			},
		],
	})
	expect(event.config).toStrictEqual({startTime: false, endTime: false, subtitle: 'location'})
})

test('strips html from the description and keeps its links', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '<div><p>See <a href="https://stolaf.edu/x">this</a>.</p></div>',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
			},
		],
	})
	expect(event.description).not.toContain('<')
	expect(event.links).toContain('https://stolaf.edu/x')
	expect(event.links).toContain('https://wp.stolaf.edu/calendar/event/a/')
})

test('treats an empty modular-content description as empty, not a failure', () => {
	const [event] = parseTecEvents({
		events: [
			{
				title: 'A',
				description: '<div data-modular-content-collection></div>',
				url: 'https://wp.stolaf.edu/calendar/event/a/',
				all_day: false,
				utc_start_date: '2026-08-17 13:00:00',
				utc_end_date: '2026-08-17 14:00:00',
			},
		],
	})
	expect(event.description).toBe('')
})

test('skips an event that cannot be parsed while its siblings still come through', () => {
	const good = {
		title: 'Good',
		description: '',
		url: 'https://wp.stolaf.edu/calendar/event/good/',
		all_day: false,
		utc_start_date: '2026-08-17 13:00:00',
		utc_end_date: '2026-08-17 14:00:00',
	}
	const events = parseTecEvents({
		events: [good, {title: 'missing everything else'}, good],
	})
	expect(events).toHaveLength(2)
})

test('throws when the response is not the expected shape', () => {
	expect(() => parseTecEvents({not: 'the right shape'})).toThrow()
})

test('throws when every event in a non-empty response is malformed', () => {
	expect(() => parseTecEvents({events: [{title: 1}, {title: 2}, 'garbage']})).toThrow()
})

test('returns an empty list when there are legitimately no upcoming events', () => {
	expect(parseTecEvents({events: []})).toStrictEqual([])
})
