import {parseEvents} from '../parsers/events'

const goodEvent = {
	dataSource: 'northfield',
	startTime: '2026-08-17T13:00:00.000Z',
	endTime: '2026-08-17T14:00:00.000Z',
	isAllDay: false,
	isMultiDay: false,
	isSameInstant: false,
	title: 'A',
	description: '',
	location: 'Northfield',
	isOngoing: false,
	links: ['https://example.com/a'],
	categories: [],
	config: {startTime: true, endTime: true, subtitle: 'location'},
}

test('passes through a well-formed event unchanged', () => {
	const [event] = parseEvents([goodEvent])
	expect(event).toStrictEqual(goodEvent)
})

test('defaults a missing location to an empty string', () => {
	const {location: _location, ...rest} = goodEvent
	const [event] = parseEvents([rest])
	expect(event.location).toBe('')
})

test('skips an event that cannot be parsed while its siblings still come through', () => {
	const events = parseEvents([goodEvent, {title: 'missing everything else'}, goodEvent])
	expect(events).toHaveLength(2)
})

test('throws when the response is not an array', () => {
	expect(() => parseEvents({not: 'an array'})).toThrow()
})

test('throws when every event in a non-empty response is malformed', () => {
	expect(() => parseEvents([{title: 1}, {title: 2}, 'garbage'])).toThrow()
})

test('returns an empty list when there are legitimately no upcoming events', () => {
	expect(parseEvents([])).toStrictEqual([])
})
