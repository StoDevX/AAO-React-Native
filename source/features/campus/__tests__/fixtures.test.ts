import {describe, expect, test} from '@jest/globals'

import {UnknownCampusError} from '../../../campuses'
import {
	fixtureKey,
	installCampusFixtures,
	MissingCampusFixture,
	serveFixture,
	tableFrom,
} from '../fixtures'

const roots = {
	'edu.stolaf': new URL('http://localhost:3000/v1/'),
	'edu.carleton': new URL('https://carleton.api.frogpond.tech/v1/'),
}

describe('fixtureKey', () => {
	test("writes a campus server's root by the campus's id, whatever the server", () => {
		expect(fixtureKey('GET', 'http://localhost:3000/v1/spaces/hours', roots)).toBe(
			'GET {server:edu.stolaf}/spaces/hours',
		)
		expect(fixtureKey('get', 'https://carleton.api.frogpond.tech/v1/dictionary', roots)).toBe(
			'GET {server:edu.carleton}/dictionary',
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
		'GET {server:edu.carleton}/dictionary': {
			status: 200,
			contentType: 'application/json',
			body: '{"data":[]}',
		},
		'GET {server:edu.carleton}/gone': {status: 404, contentType: null, body: ''},
	}

	test('answers with what was recorded', async () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/dictionary')
		let response = serveFixture('edu.carleton', table, request, roots)
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({data: []})
	})

	test('answers a recorded failure with its status', () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/gone')
		expect(serveFixture('edu.carleton', table, request, roots).status).toBe(404)
	})

	test('refuses a request nothing recorded, naming the command that records it', () => {
		let request = new Request('https://carleton.api.frogpond.tech/v1/contacts')
		expect(() => serveFixture('edu.carleton', table, request, roots)).toThrow(MissingCampusFixture)
		expect(() => serveFixture('edu.carleton', table, request, roots)).toThrow(
			/GET \{server:edu\.carleton\}\/contacts.*mise run update-campus-fixtures edu\.carleton/u,
		)
	})
})

describe('tableFrom', () => {
	test('reads a JSON answer back as the text it was', () => {
		let table = tableFrom('edu.stolaf', [
			{
				key: 'GET {server:edu.stolaf}/contacts',
				status: 200,
				contentType: 'application/json',
				json: {data: []},
			},
			{key: 'GET {server:edu.stolaf}/feed', status: 200, contentType: 'text/xml', text: '<rss/>'},
		])
		expect(table['GET {server:edu.stolaf}/contacts'].body).toBe('{"data":[]}')
		expect(table['GET {server:edu.stolaf}/feed'].body).toBe('<rss/>')
	})

	test('refuses recordings a release bundle emptied', () => {
		expect(() => tableFrom('edu.stolaf', [{}])).toThrow(/edu\.stolaf.*KEEP_UITEST_FIXTURES/u)
	})
})

describe('installCampusFixtures', () => {
	test('refuses a campus no campus here has, naming the ones there are', () => {
		expect(() => installCampusFixtures('luther.edu', 'serve')).toThrow(UnknownCampusError)
		expect(() => installCampusFixtures('luther.edu', 'serve')).toThrow(
			/--campus names luther.edu, but the campuses are edu\.stolaf, edu\.carleton/u,
		)
	})
})
