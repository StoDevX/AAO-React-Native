import {describe, expect, test} from '@jest/globals'

import {
	MAX_REQUESTS_PER_ROUTE,
	MAX_ROUTES,
	recentRequests,
	recordRequest,
	removeRequest,
	querySuggestions,
	type RequestHistory,
	type SavedRequest,
} from '../history'

const google = 'GET /v1/calendar/google'
const rss = 'GET /v1/news/rss'

function withId(id: string): SavedRequest {
	return {pathValues: {}, query: [{name: 'id', value: id}]}
}

describe('recordRequest', () => {
	test('remembers a request under its route', () => {
		let history = recordRequest([], google, withId('a'))
		expect(recentRequests(history, google)).toEqual([withId('a')])
	})

	test('puts the newest request first', () => {
		let history = recordRequest(recordRequest([], google, withId('a')), google, withId('b'))
		expect(recentRequests(history, google)).toEqual([withId('b'), withId('a')])
	})

	test('moves a repeated request to the top instead of keeping it twice', () => {
		let history: RequestHistory = []
		for (let id of ['a', 'b', 'a']) {
			history = recordRequest(history, google, withId(id))
		}
		expect(recentRequests(history, google)).toEqual([withId('a'), withId('b')])
	})

	test('treats rows with no name and padding around names as the same request', () => {
		let history = recordRequest([], google, withId('a'))
		history = recordRequest(history, google, {
			pathValues: {},
			query: [
				{name: ' id ', value: 'a'},
				{name: '', value: 'stray'},
			],
		})
		expect(recentRequests(history, google)).toEqual([withId('a')])
	})

	test('does not remember a request with nothing in it to fill back in', () => {
		let history = recordRequest([], '/ping', {pathValues: {}, query: [{name: ' ', value: ''}]})
		expect(history).toEqual([])
	})

	test(`keeps the ${MAX_REQUESTS_PER_ROUTE} newest requests for a route`, () => {
		let history: RequestHistory = []
		for (let i = 0; i <= MAX_REQUESTS_PER_ROUTE; i++) {
			history = recordRequest(history, google, withId(String(i)))
		}
		let recent = recentRequests(history, google)
		expect(recent).toHaveLength(MAX_REQUESTS_PER_ROUTE)
		expect(recent[0]).toEqual(withId(String(MAX_REQUESTS_PER_ROUTE)))
		expect(recent).not.toContainEqual(withId('0'))
	})

	test(`forgets the least recently used route past ${MAX_ROUTES} routes`, () => {
		let history: RequestHistory = []
		for (let i = 0; i <= MAX_ROUTES; i++) {
			history = recordRequest(history, `GET /route/${i}`, withId('x'))
		}
		expect(history).toHaveLength(MAX_ROUTES)
		expect(recentRequests(history, 'GET /route/0')).toEqual([])
		expect(recentRequests(history, `GET /route/${MAX_ROUTES}`)).toEqual([withId('x')])
	})

	test('using a route again keeps it from being the one forgotten', () => {
		let history: RequestHistory = []
		for (let i = 0; i < MAX_ROUTES; i++) {
			history = recordRequest(history, `GET /route/${i}`, withId('x'))
		}
		history = recordRequest(history, 'GET /route/0', withId('y'))
		history = recordRequest(history, 'GET /route/new', withId('x'))
		expect(recentRequests(history, 'GET /route/0')).toHaveLength(2)
		expect(recentRequests(history, 'GET /route/1')).toEqual([])
	})
})

describe('removeRequest', () => {
	test('forgets one request and leaves the rest', () => {
		let history = recordRequest(recordRequest([], google, withId('a')), google, withId('b'))
		expect(recentRequests(removeRequest(history, google, withId('a')), google)).toEqual([
			withId('b'),
		])
	})

	test('drops the route once its last request is gone', () => {
		let history = recordRequest([], google, withId('a'))
		expect(removeRequest(history, google, withId('a'))).toEqual([])
	})
})

describe('querySuggestions', () => {
	test('offers nothing before any request is remembered', () => {
		expect(querySuggestions([], google)).toEqual([])
	})

	test("offers this route's names first, each with its newest value", () => {
		let history = recordRequest([], rss, {pathValues: {}, query: [{name: 'url', value: 'feed'}]})
		history = recordRequest(history, google, withId('old'))
		history = recordRequest(history, google, withId('new'))
		expect(querySuggestions(history, google)).toEqual([
			{name: 'id', value: 'new'},
			{name: 'url', value: 'feed'},
		])
	})

	test('offers a name once even when several routes used it', () => {
		let history = recordRequest([], rss, withId('from-rss'))
		history = recordRequest(history, 'GET /v1/calendar/ics', withId('from-ics'))
		expect(querySuggestions(history, google)).toEqual([{name: 'id', value: 'from-ics'}])
	})
})
