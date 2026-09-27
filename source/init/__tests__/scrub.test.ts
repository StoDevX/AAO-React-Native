import type {Breadcrumb, ErrorEvent} from '@sentry/react-native'

import {scrubBreadcrumb, scrubEvent, scrubSpan, scrubUrl, type SpanJSON} from '../scrub'

describe('scrubUrl', () => {
	it('drops the query string, where Directory puts search text', () => {
		expect(scrubUrl('https://directory.example.test/search?name=Jane+Doe')).toBe(
			'https://directory.example.test/search',
		)
	})

	it('drops the fragment', () => {
		expect(scrubUrl('https://example.test/page#section')).toBe('https://example.test/page')
	})

	it('replaces the username in a StoPrint path', () => {
		expect(scrubUrl('https://print.example.test/webclient/users/jdoe/jobs/status')).toBe(
			'https://print.example.test/webclient/users/[username]/jobs/status',
		)
	})

	it('scrubs a relative URL too', () => {
		expect(scrubUrl('webclient/users/jdoe/log-in?x=1')).toBe('webclient/users/[username]/log-in')
	})

	it('leaves a URL with nothing to remove unchanged', () => {
		expect(scrubUrl('https://stolaf.api.frogpond.tech/v1/menus')).toBe(
			'https://stolaf.api.frogpond.tech/v1/menus',
		)
	})
})

describe('scrubBreadcrumb', () => {
	// Console breadcrumbs hold whatever the app logged, which can be anything.
	it('drops console breadcrumbs', () => {
		expect(scrubBreadcrumb({category: 'console', message: 'user jdoe logged in'})).toBeNull()
	})

	it.each(['fetch', 'xhr'])('scrubs the URL on a %s breadcrumb', (category) => {
		let crumb: Breadcrumb = {
			category,
			type: 'http',
			data: {method: 'GET', url: 'https://example.test/users/jdoe/jobs?page=2', status_code: 200},
		}

		expect(scrubBreadcrumb(crumb)).toStrictEqual({
			category,
			type: 'http',
			data: {method: 'GET', url: 'https://example.test/users/[username]/jobs', status_code: 200},
		})
	})

	it('passes a navigation breadcrumb through', () => {
		let crumb: Breadcrumb = {category: 'navigation', data: {from: 'Home', to: 'Menus'}}

		expect(scrubBreadcrumb(crumb)).toBe(crumb)
	})
})

describe('scrubSpan', () => {
	it('scrubs the description and URL fields of an HTTP span, and drops the query', () => {
		let span = {
			span_id: 'a',
			trace_id: 'b',
			start_timestamp: 1,
			description: 'GET https://example.test/users/jdoe/jobs',
			op: 'http.client',
			data: {
				url: 'https://example.test/users/jdoe/jobs?page=2',
				'http.url': 'https://example.test/users/jdoe/jobs?page=2',
				'url.full': 'https://example.test/users/jdoe/jobs?page=2',
				'http.query': '?page=2',
				'http.fragment': '#top',
				'http.method': 'GET',
			},
		} as SpanJSON

		expect(scrubSpan(span)).toMatchObject({
			description: 'GET https://example.test/users/[username]/jobs',
			data: {
				url: 'https://example.test/users/[username]/jobs',
				'http.url': 'https://example.test/users/[username]/jobs',
				'url.full': 'https://example.test/users/[username]/jobs',
				'http.method': 'GET',
			},
		})
		expect(scrubSpan(span).data).not.toHaveProperty('http.query')
		expect(scrubSpan(span).data).not.toHaveProperty('http.fragment')
	})

	it('leaves a span with no URL alone', () => {
		let span = {
			span_id: 'a',
			trace_id: 'b',
			start_timestamp: 1,
			description: 'Menus',
			op: 'navigation',
			data: {'route.name': 'Menus'},
		} as SpanJSON

		expect(scrubSpan(span)).toStrictEqual(span)
	})
})

describe('scrubEvent', () => {
	// Where a failed-request event carries the request it failed on.
	it('scrubs the request URL and drops its query string and cookies', () => {
		let event: ErrorEvent = {
			type: undefined,
			request: {
				url: 'https://example.test/users/jdoe/jobs?page=2',
				query_string: 'page=2',
				cookies: {session: 'abc'},
				method: 'GET',
			},
		}

		expect(scrubEvent(event).request).toStrictEqual({
			url: 'https://example.test/users/[username]/jobs',
			method: 'GET',
		})
	})

	it('leaves an event with no request alone', () => {
		let event: ErrorEvent = {type: undefined, message: 'boom'}

		expect(scrubEvent(event)).toBe(event)
	})
})
