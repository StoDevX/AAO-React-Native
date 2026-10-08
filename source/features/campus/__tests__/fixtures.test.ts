import {describe, expect, test} from '@jest/globals'

import {fixtureKey, MissingCampusFixture, serveFixture} from '../fixtures'

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
