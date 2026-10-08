import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {
	campusFixtureFiles,
	LARGE_BODY_BYTES,
	mergeCampusRecordings,
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
