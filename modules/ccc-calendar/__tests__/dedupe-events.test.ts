import moment from 'moment'
import type {SourcedEvent} from '@frogpond/event-list'
import {dedupeEvents} from '../use-merged-events'

// `use-merged-events.ts` imports `./query` at module scope for its live
// fetchers, and `query.ts` reaches real `expo-calendar`, which throws when
// loaded outside a native runtime. `dedupeEvents` is a pure function that
// never calls the fetchers, so the mock only needs to satisfy the shape.
jest.mock('../query', () => ({
	namedCalendarOptions: jest.fn(),
	deviceCalendarOptions: jest.fn(),
}))

function sourced(
	sourceId: string,
	title: string,
	startTime: string,
	organization?: string[],
): SourcedEvent {
	return {
		sourceId,
		key: `${startTime}|${title}`,
		event: {
			title,
			description: '',
			location: '',
			startTime: moment(startTime),
			endTime: moment(startTime).add(1, 'hour'),
			isAllDay: false,
			isMultiDay: false,
			isSameInstant: false,
			isOngoing: false,
			links: [],
			categories: [],
			organization,
			config: {startTime: true, endTime: true, subtitle: 'location'},
		},
	}
}

const KICKOFF = '2026-09-15T18:00:00Z'
const SOCCER = '2026-09-08T20:00:00Z'

test('keeps one copy of an event both calendars carry', () => {
	let merged = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER),
	])
	expect(merged).toHaveLength(1)
})

test('the earlier source wins, so the campus calendar does', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER),
	])
	expect(survivor.sourceId).toBe('stolaf')
	expect(survivor.event.title).toBe('Men’s Soccer vs Carroll University')
})

test('leaves events only one calendar carries alone', () => {
	let merged = dedupeEvents([
		sourced('stolaf', 'Daily Chapel', SOCCER),
		sourced('presence', 'First Friday Cash Cab', KICKOFF),
	])
	expect(merged).toHaveLength(2)
})

test('does not merge the split and combined cross country listings', () => {
	let merged = dedupeEvents([
		sourced('stolaf', "Men's Cross Country vs Alumni 5K Meet", SOCCER),
		sourced('stolaf', "Women's Cross Country vs Alumni 5K Meet", SOCCER),
		sourced('presence', "Men's and Women's Cross Country Alumni 5K Meet", SOCCER),
	])
	expect(merged).toHaveLength(3)
})

test('keeps two genuinely different events that start together', () => {
	let merged = dedupeEvents([
		sourced('stolaf', 'Volleyball vs University of Dubuque', SOCCER),
		sourced('presence', 'Co-Curricular Fair', SOCCER),
	])
	expect(merged).toHaveLength(2)
})

test('preserves the order it was given', () => {
	let merged = dedupeEvents([
		sourced('stolaf', 'B', KICKOFF),
		sourced('stolaf', 'A', SOCCER),
		sourced('presence', 'B', KICKOFF),
	])
	expect(merged.map((entry) => entry.event.title)).toStrictEqual(['B', 'A'])
})

test('the survivor inherits the sponsoring organisation of the copy it displaced', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER, ['St. Olaf Athletics']),
	])
	expect(survivor.event.organization).toStrictEqual(['St. Olaf Athletics'])
})

test('inheriting an organisation changes nothing else about the survivor', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER, ['St. Olaf Athletics']),
	])
	expect(survivor.sourceId).toBe('stolaf')
	expect(survivor.event.title).toBe('Men’s Soccer vs Carroll University')
})

test('a survivor that names its own organisation keeps it, ahead of the ones it gains', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER, ['College Events']),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER, ['St. Olaf Athletics']),
	])
	expect(survivor.event.organization).toStrictEqual(['College Events', 'St. Olaf Athletics'])
})

test('an organisation both copies name is listed once', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER, ['St. Olaf Athletics']),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER, [
			'St. Olaf Athletics',
			'SOAR',
		]),
	])
	expect(survivor.event.organization).toStrictEqual(['St. Olaf Athletics', 'SOAR'])
})

test('a third copy adds its organisations too', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER, ['College Events']),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER, ['St. Olaf Athletics']),
		sourced('presence', 'Men’s soccer vs Carroll University', SOCCER, ['SOAR']),
	])
	expect(survivor.event.organization).toStrictEqual([
		'College Events',
		'St. Olaf Athletics',
		'SOAR',
	])
})

test('an event no calendar sponsors stays unsponsored', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER),
	])
	expect(survivor.event.organization).toBeUndefined()
})

test('a copy that names no organisation leaves the survivor alone', () => {
	let [survivor] = dedupeEvents([
		sourced('stolaf', 'Men’s Soccer vs Carroll University', SOCCER, ['College Events']),
		sourced('presence', "Men's Soccer vs. Carroll University", SOCCER),
	])
	expect(survivor.event.organization).toStrictEqual(['College Events'])
})
