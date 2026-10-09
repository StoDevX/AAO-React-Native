import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {tmpdir} from 'node:os'

import {
	campusFixtureFiles,
	completeTecPages,
	failedKeys,
	frozenDay,
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
		'GET {server:edu.stolaf}/spaces/hours': {
			status: 200,
			contentType: 'application/json',
			body: '{"data":[1]}',
		},
		'GET https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50': {
			status: 200,
			contentType: 'application/json; charset=UTF-8',
			body: '[]',
		},
		'GET {server:edu.stolaf}/feed': {status: 200, contentType: 'text/xml', body: '<rss/>'},
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
			key: 'GET {server:edu.stolaf}/spaces/hours',
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
		assert.equal(trimmedBody('GET {server:edu.stolaf}/spaces/hours', body), body)
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
	const starts = (table, key) => events(table, key).map((event) => event.startTime)
	const CARLETON = 'GET {server:edu.carleton}/calendar/named/carleton'
	const SUMO = 'GET {server:edu.carleton}/calendar/named/sumo-schedule'
	const TEC = 'GET https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50'
	// The UI tests' frozen day, a Saturday.
	const FROZEN = '2026-09-05'

	it("moves a campus's calendars back by whole weeks, landing a day with events on the frozen day", () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					{
						title: 'Friday',
						startTime: '2026-10-09T15:00:00.000Z',
						endTime: '2026-10-09T16:00:00.000Z',
					},
					{
						title: 'Saturday',
						startTime: '2026-10-10T18:00:00.000Z',
						endTime: '2026-10-10T19:00:00.000Z',
					},
				]),
				[SUMO]: answer([
					{
						title: 'Film',
						startTime: '2026-10-16T19:00:00.000Z',
						endTime: '2026-10-16T21:00:00.000Z',
					},
				]),
			},
			{frozenDay: FROZEN, recordedDay: '2026-10-08'},
		)
		assert.deepEqual(starts(table, CARLETON), [
			'2026-09-04T15:00:00.000Z',
			'2026-09-05T18:00:00.000Z',
		])
		assert.deepEqual(starts(table, SUMO), ['2026-09-11T19:00:00.000Z'])
	})

	it('takes the first such day from the recording on, by the colleges’ clock', () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					// A Saturday before the recording, which the feed still sends.
					{
						title: 'Past',
						startTime: '2026-10-03T18:00:00.000Z',
						endTime: '2026-10-03T19:00:00.000Z',
					},
					// 7 PM Central on Saturday Oct 10, which is Sunday in UTC.
					{
						title: 'Evening',
						startTime: '2026-10-11T00:00:00.000Z',
						endTime: '2026-10-11T01:00:00.000Z',
					},
				]),
			},
			{frozenDay: FROZEN, recordedDay: '2026-10-08'},
		)
		assert.deepEqual(starts(table, CARLETON), [
			'2026-08-29T18:00:00.000Z',
			'2026-09-06T00:00:00.000Z',
		])
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
							title: 'Game',
							utc_start_date: '2026-10-10 18:00:00',
							utc_end_date: '2026-10-10 20:00:00',
						},
					],
				}),
			},
			{frozenDay: FROZEN, recordedDay: '2026-10-08'},
		)
		assert.deepEqual(events(table, TEC).events, [
			{
				title: 'Exhibition',
				utc_start_date: '2026-06-27 15:00:00',
				// It ends at 5 PM CST, which moves to 5 PM CDT: an hour earlier in UTC.
				utc_end_date: '2026-10-27 22:00:00',
			},
			{title: 'Game', utc_start_date: '2026-09-05 18:00:00', utc_end_date: '2026-09-05 20:00:00'},
		])
	})

	it('keeps weekdays even when no day with events falls on the frozen day’s', () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					{
						title: 'Monday',
						startTime: '2026-10-12T15:00:00.000Z',
						endTime: '2026-10-12T16:00:00.000Z',
					},
				]),
			},
			{frozenDay: FROZEN, recordedDay: '2026-10-08'},
		)
		// Monday Oct 12 lands on Monday Aug 31, six weeks back.
		assert.deepEqual(starts(table, CARLETON), ['2026-08-31T15:00:00.000Z'])
	})

	it('keeps an event at its time of day at the colleges, across a change of clocks', () => {
		let table = shiftCalendars(
			{
				[CARLETON]: answer([
					// 11:30 PM CST on Saturday Nov 7, after the clocks went back.
					{
						title: 'Late',
						startTime: '2026-11-08T05:30:00.000Z',
						endTime: '2026-11-08T06:30:00.000Z',
					},
				]),
			},
			{frozenDay: FROZEN, recordedDay: '2026-11-05'},
		)
		// 11:30 PM CDT on Saturday Sep 5, not 12:30 AM on the Sunday.
		assert.deepEqual(starts(table, CARLETON), ['2026-09-06T04:30:00.000Z'])
	})

	it('keeps each feed’s own way of writing a time', () => {
		let presence = 'GET https://api.presence.io/stolaf/v1/events'
		let table = shiftCalendars(
			{
				[presence]: answer([
					{startDateTimeUtc: '2026-09-12T17:00:00Z', endDateTimeUtc: '2026-09-12T18:00:00Z'},
				]),
				[TEC]: answer({
					events: [{utc_start_date: '2026-09-12 17:00:00', utc_end_date: '2026-09-12 18:00:00'}],
				}),
			},
			{frozenDay: FROZEN, recordedDay: '2026-09-10'},
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
		assert.deepEqual(shiftCalendars(before, {frozenDay: FROZEN, recordedDay: FROZEN}), before)
	})

	it('leaves every other answer as it came', () => {
		let hours = {
			'GET {server:edu.carleton}/spaces/hours': answer({data: [{startTime: '2026-10-09'}]}),
		}
		assert.deepEqual(shiftCalendars(hours, {frozenDay: FROZEN, recordedDay: '2026-10-09'}), hours)
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
		let key = 'GET {server:edu.carleton}/calendar/named/carleton'
		let body = JSON.stringify([
			{description: 'Questions? Email a.student@carleton.edu or HELP@stolaf.edu.'},
		])
		let table = mergeCampusRecordings([line(key, body)])
		assert.deepEqual(JSON.parse(table[key].body), [
			{description: 'Questions? Email person@example.com or person@example.com.'},
		])
	})

	it('leave an image named for its scale alone', () => {
		let key = 'GET {server:edu.stolaf}/contacts'
		let body = JSON.stringify({image: 'https://x.example/logo@2x.png'})
		assert.equal(mergeCampusRecordings([line(key, body)])[key].body, body)
	})

	it('are looked for quickly in a long run of text with none', () => {
		let key = 'GET {server:edu.stolaf}/contacts'
		let body = JSON.stringify({image: 'x'.repeat(LARGE_BODY_BYTES / 2)})
		let started = performance.now()
		mergeCampusRecordings([line(key, body)])
		assert.ok(performance.now() - started < 1000, 'a 100 KB run should take well under a second')
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

describe('an answer that is not a feed', () => {
	const TEC = 'GET https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events?per_page=50'
	const HTML = '<html>Service Unavailable</html>'

	it('is kept as it came, rather than trimmed', () => {
		let table = mergeCampusRecordings([
			JSON.stringify({key: TEC, status: 503, contentType: 'text/html', body: HTML}),
		])
		assert.equal(table[TEC].body, HTML)
	})

	it('is left out of the calendar shift', () => {
		let table = {[TEC]: {status: 503, contentType: 'text/html', body: HTML}}
		assert.deepEqual(
			shiftCalendars(table, {frozenDay: '2026-09-05', recordedDay: '2026-10-08'}),
			table,
		)
	})

	it('is named in the recording summary', () => {
		let table = {
			[TEC]: {status: 503, contentType: 'text/html', body: HTML},
			'GET {server:edu.stolaf}/contacts': {
				status: 200,
				contentType: 'application/json',
				body: '{}',
			},
		}
		assert.deepEqual(failedKeys(table), [`${TEC} (503)`])
	})
})

describe('completeTecPages, against a feed that misbehaves', () => {
	const EVENTS = 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events'
	const json = (body, status = 200) => ({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body),
	})
	const first = {[`GET ${EVENTS}?page=1`]: json({events: [], next_rest_url: `${EVENTS}?page=2`})}

	it('stops where the app does, past ten pages', async () => {
		let endless = (url) => {
			let n = Number(new URL(url).searchParams.get('page'))
			return Promise.resolve(json({events: [], next_rest_url: `${EVENTS}?page=${n + 1}`}))
		}
		await assert.rejects(completeTecPages(first, endless), /ran past 10 pages/u)
	})

	it('records a page that failed without following it', async () => {
		let asked = []
		let table = await completeTecPages(first, (url) => {
			asked.push(url)
			return Promise.resolve({status: 500, contentType: 'text/html', body: '<html>oops</html>'})
		})
		assert.deepEqual(asked, [`${EVENTS}?page=2`])
		assert.equal(table[`GET ${EVENTS}?page=2`].status, 500)
	})

	it('refuses a page over 200 KB unless large ones are allowed', async () => {
		let big = () =>
			Promise.resolve(json({events: [{title: 'x', description: 'x'.repeat(LARGE_BODY_BYTES)}]}))
		await assert.rejects(completeTecPages(first, big), /--allow-large/u)
		await completeTecPages(first, big, {allowLarge: true})
	})
})

describe('frozenDay', () => {
	it("reads the UI tests' frozen day, wherever the recorder runs from", () => {
		let here = process.cwd()
		process.chdir(tmpdir())
		try {
			assert.match(frozenDay(), /^\d{4}-\d{2}-\d{2}$/u)
		} finally {
			process.chdir(here)
		}
	})
})
