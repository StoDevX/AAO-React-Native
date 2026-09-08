import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {dedupeKey} from '../calendar-util'

function event(title: string, startTime = '2026-09-08T20:00:00Z'): EventType {
	return {
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
		config: {startTime: true, endTime: true, subtitle: 'location'},
	}
}

test('a curly and a straight apostrophe agree', () => {
	expect(dedupeKey(event('Men’s Soccer vs Carroll'))).toBe(
		dedupeKey(event("Men's Soccer vs Carroll")),
	)
})

test('"vs" and "vs." agree', () => {
	expect(dedupeKey(event('Men’s Soccer vs Carroll University'))).toBe(
		dedupeKey(event("Men's Soccer vs. Carroll University")),
	)
})

test('case and spacing do not matter', () => {
	expect(dedupeKey(event('  Hispanic  History Month KICKOFF '))).toBe(
		dedupeKey(event('Hispanic History Month Kickoff')),
	)
})

test('the same title at a different time is a different event', () => {
	expect(dedupeKey(event('Chapel', '2026-09-08T20:00:00Z'))).not.toBe(
		dedupeKey(event('Chapel', '2026-09-09T20:00:00Z')),
	)
})

test("men's and women's cross country stay distinct", () => {
	expect(dedupeKey(event("Men's Cross Country vs Alumni 5K Meet"))).not.toBe(
		dedupeKey(event("Women's Cross Country vs Alumni 5K Meet")),
	)
})

test('a combined listing does not match either half', () => {
	let combined = dedupeKey(event("Men's and Women's Cross Country Alumni 5K Meet"))
	expect(combined).not.toBe(dedupeKey(event("Men's Cross Country vs Alumni 5K Meet")))
	expect(combined).not.toBe(dedupeKey(event("Women's Cross Country vs Alumni 5K Meet")))
})

// `.normalize('NFKD')` splits a letter from its diacritic, and the
// letters-and-digits fold then drops the diacritic. Nothing else in the key
// does that, so removing the call would quietly stop an accented title from
// matching its unaccented twin.
test('an accented title matches its unaccented twin', () => {
	expect(dedupeKey(event('Café Concert'))).toBe(dedupeKey(event('Cafe Concert')))
})
