import {describe, expect, test} from '@jest/globals'

import {fixtureKey, MissingCampusFixture, serveFixture, tableFrom} from '../fixtures'

const roots = {
	'stolaf.edu': new URL('http://localhost:3000/v1/'),
	'carleton.edu': new URL('https://carleton.api.frogpond.tech/v1/'),
}

describe('fixtureKey', () => {
	test("writes a campus server's root by the campus's domain, whatever the server", () => {
		expect(fixtureKey('GET', 'http://localhost:3000/v1/spaces/hours', roots)).toBe(
			'GET {server:stolaf.edu}/spaces/hours',
		)
		expect(fixtureKey('get', 'https://carleton.api.frogpond.tech/v1/dictionary', roots)).toBe(
			'GET {server:carleton.edu}/dictionary',
		)
	})

	test('keeps a URL on no campus server whole, query and all', () => {
		expect(
			fixtureKey('GET', 'https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50', roots),
		).toBe('GET https://thecarletonian.com/wp-json/wp/v2/posts?per_page=50')
	})

	test("writes the St. Olaf calendar's window as {date}, so a recording answers on any day", () => {
		let events = 'https://wp.stolaf.edu/calendar/wp-json/tribe/events/v1/events'
		expect(
			fixtureKey(
				'GET',
				`${events}?per_page=50&ends_after=2026-10-07&starts_before=2026-11-08`,
				roots,
			),
		).toBe(`GET ${events}?per_page=50&ends_after={date}&starts_before={date}`)
		expect(
			fixtureKey(
				'GET',
				`${events}/?per_page=50&starts_before=2026-11-08+23%3A59%3A59&ends_after=2026-10-07+23%3A59%3A59&page=2`,
				roots,
			),
		).toBe(`GET ${events}/?per_page=50&starts_before={date}&ends_after={date}&page=2`)
	})

	test("keeps another feed's dates, which say what it was asked for", () => {
		expect(fixtureKey('GET', 'https://x.example/feed?ends_after=2026-10-07', roots)).toBe(
			'GET https://x.example/feed?ends_after=2026-10-07',
		)
	})
})

describe('serveFixture', () => {
	const table = {
		'GET {server:carleton.edu}/dictionary': {
			status: 200,
			contentType: 'application/json',
			body: '{"data":[]}',
		},
		'GET {server:carleton.edu}/gone': {status: 404, contentType: null, body: ''},
	}

	test('answers with what was recorded', async () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/dictionary')
		let response = serveFixture('carleton.edu', table, request, roots)
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({data: []})
	})

	test('answers a recorded failure with its status', () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/gone')
		expect(serveFixture('carleton.edu', table, request, roots).status).toBe(404)
	})

	test('refuses a request nothing recorded, naming the command that records it', () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/contacts')
		expect(() => serveFixture('carleton.edu', table, request, roots)).toThrow(MissingCampusFixture)
		expect(() => serveFixture('carleton.edu', table, request, roots)).toThrow(
			/GET \{server:carleton\.edu\}\/contacts.*mise run update-campus-fixtures carleton\.edu/u,
		)
	})
})

describe('tableFrom', () => {
	test('reads a JSON answer back as the text it was', () => {
		let table = tableFrom('stolaf.edu', [
			{
				key: 'GET {server:stolaf.edu}/contacts',
				status: 200,
				contentType: 'application/json',
				json: {data: []},
			},
			{key: 'GET {server:stolaf.edu}/feed', status: 200, contentType: 'text/xml', text: '<rss/>'},
		])
		expect(table['GET {server:stolaf.edu}/contacts'].body).toBe('{"data":[]}')
		expect(table['GET {server:stolaf.edu}/feed'].body).toBe('<rss/>')
	})

	test('refuses recordings a release bundle emptied', () => {
		expect(() => tableFrom('stolaf.edu', [{}])).toThrow(/stolaf\.edu.*KEEP_UITEST_FIXTURES/u)
	})
})
