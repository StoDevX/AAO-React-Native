import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {
	campusFixtureFiles,
	completeTecPages,
	LARGE_BODY_BYTES,
	mergeCampusRecordings,
	shiftCalendars,
	trimmedBody,
} from './campus-fixtures.mjs'

const line = (key, body, status = 200) =>
	JSON.stringify({key, status, contentType: 'application/json', body})

describe('mergeCampusRecordings', () => {
	it('keeps the last answer to each request, with keys in order', () => {
		let table = mergeCampusRecordings([
			line('GET b', '2'),
			line('GET a', '1'),
			line('GET b', '3'),
			'',
		])
		assert.deepEqual(Object.keys(table), ['GET a', 'GET b'])
		assert.equal(table['GET b'].body, '3')
	})

	it('refuses an empty recording, which is a broken run', () => {
		assert.throws(() => mergeCampusRecordings(['']), /nothing was recorded/u)
	})

	it('refuses a body over 200 KB unless large ones are allowed', () => {
		let big = 'x'.repeat(LARGE_BODY_BYTES + 1)
		assert.throws(() => mergeCampusRecordings([line('GET feed', big)]), /GET feed.*--allow-large/u)
		assert.equal(
			mergeCampusRecordings([line('GET feed', big)], {allowLarge: true})['GET feed'].body,
			big,
		)
	})
})

describe('campusFixtureFiles', () => {
	const table = {
		'GET {server:stolaf.edu}/spaces/hours': {
			status: 200,
			contentType: 'application/json',
			body: '{"data":[1]}',
		},
		'GET https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50': {
			status: 200,
			contentType: 'application/json; charset=UTF-8',
			body: '[]',
		},
		'GET {server:stolaf.edu}/feed': {status: 200, contentType: 'text/xml', body: '<rss/>'},
	}

	it('names each request by its method and path', () => {
		assert.deepEqual(Object.keys(campusFixtureFiles(table).files).sort(), [
			'GET-feed.json',
			'GET-spaces-hours.json',
			'GET-thecarletonian.com-wp-json-wp-v2-posts-per_page-50.json',
		])
	})

	it('keeps a JSON answer as JSON, so a diff shows which fields moved', () => {
		let file = JSON.parse(campusFixtureFiles(table).files['GET-spaces-hours.json'])
		assert.deepEqual(file, {
			key: 'GET {server:stolaf.edu}/spaces/hours',
			status: 200,
			contentType: 'application/json',
			json: {data: [1]},
		})
	})

	it('keeps any other answer as its text', () => {
		let file = JSON.parse(campusFixtureFiles(table).files['GET-feed.json'])
		assert.equal(file.text, '<rss/>')
	})

	it('writes an index that imports every file', () => {
		let {index} = campusFixtureFiles(table)
		assert.match(index, /import f0 from '\.\/GET-feed\.json'/u)
		assert.match(index, /export default \[f0, f1, f2\]/u)
	})
})

describe('trimmedBody', () => {
	it('keeps only what the St. Olaf calendar parser reads of a TEC page', () => {
		let page = {
			next_rest_url: 'page-2',
			total: 152,
			events: [
				{
					title: 'Orientation',
					description: '<p>Welcome</p>',
					url: 'https://wp.stolaf.edu/calendar/event/orientation/',
					all_day: true,
					utc_start_date: '2026-09-04 05:00:00',
					utc_end_date: '2026-09-07 04:59:59',
					venue: {venue: 'Buntrock Commons', address: '1520 St. Olaf Ave'},
					organizer: [{organizer: 'Student Life', email: 'life@stolaf.edu'}],
					categories: [{name: 'Featured', slug: 'featured'}],
					cost_details: {values: []},
					rest_url: 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events/1',
				},
				{title: 'No venue', venue: [], organizer: []},
			],
		}
		let key = 'GET https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50'
		assert.deepEqual(JSON.parse(trimmedBody(key, JSON.stringify(page))), {
			next_rest_url: 'page-2',
			events: [
				{
					title: 'Orientation',
					description: '<p>Welcome</p>',
					url: 'https://wp.stolaf.edu/calendar/event/orientation/',
					all_day: true,
					utc_start_date: '2026-09-04 05:00:00',
					utc_end_date: '2026-09-07 04:59:59',
					venue: {venue: 'Buntrock Commons'},
					organizer: [{organizer: 'Student Life'}],
					categories: [{name: 'Featured'}],
				},
				{title: 'No venue', venue: [], organizer: []},
			],
		})
	})

	it("keeps only what the Presence parser reads, dropping organizers' contact details", () => {
		let events = [
			{
				eventName: 'OUTS Climb',
				organizationName: 'OUTS',
				uri: 'outs-climb',
				description: '<p>Climb</p>',
				location: 'Tostrud',
				startDateTimeUtc: '2026-10-10T18:00:00Z',
				endDateTimeUtc: '2026-10-10T20:00:00Z',
				hasCoverImage: true,
				photoUriWithVersion: 'photo.jpg?v=1',
				contactName: 'A Student',
				contactEmail: 'student@stolaf.edu',
				apiId: '00000000-0000-0000-0000-000000000000',
			},
		]
		let key = 'GET https://api.presence.io/stolaf/v1/events'
		assert.deepEqual(JSON.parse(trimmedBody(key, JSON.stringify(events))), [
			{
				eventName: 'OUTS Climb',
				organizationName: 'OUTS',
				uri: 'outs-climb',
				description: '<p>Climb</p>',
				location: 'Tostrud',
				startDateTimeUtc: '2026-10-10T18:00:00Z',
				endDateTimeUtc: '2026-10-10T20:00:00Z',
				hasCoverImage: true,
				photoUriWithVersion: 'photo.jpg?v=1',
			},
		])
	})

	it('leaves any other answer as it came', () => {
		let body = '{"data":[{"name":"The Cage","extra":1}]}'
		assert.equal(trimmedBody('GET {server:stolaf.edu}/spaces/hours', body), body)
	})

	it('measures a recording against the size limit after trimming', () => {
		let event = {title: 'x', padding: 'x'.repeat(LARGE_BODY_BYTES)}
		let key = 'GET https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events'
		let table = mergeCampusRecordings([line(key, JSON.stringify({events: [event]}))])
		assert.deepEqual(JSON.parse(table[key].body), {events: [{title: 'x'}]})
	})
})

describe('shiftCalendars', () => {
	const answer = (json) => ({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify(json),
	})
	const events = (table, key) => JSON.parse(table[key].body)
	const CARLETON = 'GET {server:carleton.edu}/calendar/named/carleton'
	const SUMO = 'GET {server:carleton.edu}/calendar/named/sumo-schedule'
	const TEC = 'GET https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50'

	it("moves a campus's calendars back together, so the day they were recorded is the frozen day", () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					// 7 PM Central on Oct 5, which is Oct 6 in UTC.
					{
						title: 'First',
						startTime: '2026-10-06T00:00:00.000Z',
						endTime: '2026-10-06T01:00:00.000Z',
					},
				]),
				[SUMO]: answer([
					{
						title: 'Film',
						startTime: '2026-10-09T19:00:00.000Z',
						endTime: '2026-10-09T21:00:00.000Z',
					},
				]),
			},
			{frozenDay: '2026-09-05', recordedDay: '2026-10-05'},
		)
		assert.deepEqual(events(table, CARLETON), [
			{title: 'First', startTime: '2026-09-06T00:00:00.000Z', endTime: '2026-09-06T01:00:00.000Z'},
		])
		assert.deepEqual(events(table, SUMO), [
			{title: 'Film', startTime: '2026-09-09T19:00:00.000Z', endTime: '2026-09-09T21:00:00.000Z'},
		])
	})

	it('lands the first day with events from the recording day on, when that day had none', () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					{
						title: 'Exhibition',
						startTime: '2026-10-04T15:00:00.000Z',
						endTime: '2026-11-01T23:00:00.000Z',
					},
					{
						title: 'Next',
						startTime: '2026-10-09T15:00:00.000Z',
						endTime: '2026-10-09T16:00:00.000Z',
					},
				]),
			},
			{frozenDay: '2026-09-05', recordedDay: '2026-10-08'},
		)
		assert.deepEqual(
			events(table, CARLETON).map((event) => event.startTime),
			['2026-08-31T15:00:00.000Z', '2026-09-05T15:00:00.000Z'],
		)
	})

	it('moves an event that began long before the recording by as much as the rest', () => {
		let table = shiftCalendars(
			{
				[TEC]: answer({
					events: [
						{
							title: 'Exhibition',
							utc_start_date: '2026-08-01 15:00:00',
							utc_end_date: '2026-12-01 23:00:00',
						},
						{
							title: 'Talk',
							utc_start_date: '2026-10-08 18:00:00',
							utc_end_date: '2026-10-08 19:00:00',
						},
					],
				}),
			},
			{frozenDay: '2026-09-05', recordedDay: '2026-10-08'},
		)
		assert.deepEqual(events(table, TEC).events, [
			{
				title: 'Exhibition',
				utc_start_date: '2026-06-29 15:00:00',
				utc_end_date: '2026-10-29 23:00:00',
			},
			{title: 'Talk', utc_start_date: '2026-09-05 18:00:00', utc_end_date: '2026-09-05 19:00:00'},
		])
	})

	it('keeps each feed’s own way of writing a time', () => {
		let presence = 'GET https://api.presence.io/stolaf/v1/events'
		let table = shiftCalendars(
			{
				[presence]: answer([
					{startDateTimeUtc: '2026-09-16T17:00:00Z', endDateTimeUtc: '2026-09-16T18:00:00Z'},
				]),
				[TEC]: answer({
					events: [{utc_start_date: '2026-09-16 17:00:00', utc_end_date: '2026-09-16 18:00:00'}],
				}),
			},
			{frozenDay: '2026-09-05', recordedDay: '2026-09-16'},
		)
		assert.deepEqual(events(table, presence), [
			{startDateTimeUtc: '2026-09-05T17:00:00Z', endDateTimeUtc: '2026-09-05T18:00:00Z'},
		])
		assert.deepEqual(events(table, TEC), {
			events: [{utc_start_date: '2026-09-05 17:00:00', utc_end_date: '2026-09-05 18:00:00'}],
		})
	})

	it('leaves calendars recorded on the frozen day as they came', () => {
		let before = {
			[CARLETON]: answer([
				{startTime: '2026-09-05T17:00:00.000Z', endTime: '2026-09-05T18:00:00.000Z'},
			]),
		}
		assert.deepEqual(
			shiftCalendars(before, {frozenDay: '2026-09-05', recordedDay: '2026-09-05'}),
			before,
		)
	})

	it('leaves every other answer as it came', () => {
		let hours = {
			'GET {server:carleton.edu}/spaces/hours': answer({data: [{startTime: '2026-10-09'}]}),
		}
		assert.deepEqual(
			shiftCalendars(hours, {frozenDay: '2026-09-05', recordedDay: '2026-10-09'}),
			hours,
		)
	})
})

describe('completeTecPages', () => {
	const EVENTS = 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events'
	const page = (n) => `${EVENTS}/?per_page=50&ends_after=2026-10-07&page=${n}`
	const keyOf = (n) => `GET ${EVENTS}/?per_page=50&ends_after={date}&page=${n}`
	const answer = (json) => ({
		status: 200,
		contentType: 'application/json',
		body: JSON.stringify(json),
	})

	it('fetches the pages a run left unasked, as the app keys them, trimmed', async () => {
		let asked = []
		let pages = {
			[page(2)]: {events: [{title: 'Two', extra: 1}], next_rest_url: page(3)},
			[page(3)]: {events: [{title: 'Three'}]},
		}
		let table = await completeTecPages(
			{[keyOf(1)]: answer({events: [], next_rest_url: page(2)})},
			(url) => {
				asked.push(url)
				return Promise.resolve(answer(pages[url]))
			},
		)
		assert.deepEqual(asked, [page(2), page(3)])
		assert.deepEqual(Object.keys(table).sort(), [keyOf(1), keyOf(2), keyOf(3)])
		assert.deepEqual(JSON.parse(table[keyOf(2)].body), {
			events: [{title: 'Two'}],
			next_rest_url: page(3),
		})
	})

	it('asks for nothing when the run recorded every page', async () => {
		let table = {
			[keyOf(1)]: answer({events: [], next_rest_url: page(2)}),
			[keyOf(2)]: answer({events: []}),
		}
		let asked = []
		await completeTecPages(table, (url) => {
			asked.push(url)
			return Promise.resolve(answer({events: []}))
		})
		assert.deepEqual(asked, [])
	})
})

describe('email addresses', () => {
	it('are each written person@example.com, wherever a recording holds one', () => {
		let key = 'GET {server:carleton.edu}/calendar/named/carleton'
		let body = JSON.stringify([
			{description: 'Questions? Email a.student@carleton.edu or HELP@stolaf.edu.'},
		])
		let table = mergeCampusRecordings([line(key, body)])
		assert.deepEqual(JSON.parse(table[key].body), [
			{description: 'Questions? Email person@example.com or person@example.com.'},
		])
	})

	it('are written person@example.com in a page fetched to finish a run', async () => {
		const EVENTS = 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events'
		let first = {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({events: [], next_rest_url: `${EVENTS}?page=2`}),
		}
		let table = await completeTecPages({[`GET ${EVENTS}?page=1`]: first}, () =>
			Promise.resolve({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({events: [{title: 'x', description: 'me@stolaf.edu'}]}),
			}),
		)
		assert.equal(
			JSON.parse(table[`GET ${EVENTS}?page=2`].body).events[0].description,
			'person@example.com',
		)
	})
})
