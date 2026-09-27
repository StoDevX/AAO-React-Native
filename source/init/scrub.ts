import type {Breadcrumb, Event, ReactNativeOptions} from '@sentry/react-native'

/** A span as `beforeSendSpan` receives it; @sentry/react-native doesn't export the type itself. */
export type SpanJSON = Parameters<NonNullable<ReactNativeOptions['beforeSendSpan']>>[0]

/** The span data fields that hold a request's full URL. */
const URL_FIELDS = ['url', 'http.url', 'url.full']

/** The span data fields that hold only a query string or fragment. */
const QUERY_FIELDS = ['http.query', 'http.fragment']

/** A StoPrint path segment naming the signed-in person (`source/lib/stoprint/api.ts`). */
const USERNAME_SEGMENT = /\/users\/[^/?#]+/gu

/**
 * A URL with nothing that can name a person: no query string or fragment,
 * where Directory puts search text, and no username in the path.
 */
export function scrubUrl(url: string): string {
	let end = url.search(/[?#]/u)
	let path = end === -1 ? url : url.slice(0, end)
	return path.replace(USERNAME_SEGMENT, '/users/[username]')
}

/**
 * Drops console breadcrumbs, which hold whatever the app logged, and scrubs
 * the URL on request breadcrumbs.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
	if (breadcrumb.category === 'console') {
		return null
	}
	let url: unknown = breadcrumb.data?.url
	if (typeof url !== 'string') {
		return breadcrumb
	}
	return {...breadcrumb, data: {...breadcrumb.data, url: scrubUrl(url)}}
}

/**
 * Scrubs the URL in an HTTP span's description and data, and drops its query
 * string and fragment fields.
 */
export function scrubSpan(span: SpanJSON): SpanJSON {
	let data = {...span.data}
	for (let field of URL_FIELDS) {
		let value: unknown = data[field]
		if (typeof value === 'string') {
			data[field] = scrubUrl(value)
		}
	}
	for (let field of QUERY_FIELDS) {
		delete data[field]
	}
	let description = span.description === undefined ? undefined : scrubUrl(span.description)
	return {...span, description, data}
}

/**
 * Scrubs the request a failed-request event carries: its URL, query string
 * and cookies.
 */
export function scrubEvent<E extends Event>(event: E): E {
	if (!event.request) {
		return event
	}
	let {query_string: _query, cookies: _cookies, ...request} = event.request
	return {
		...event,
		request: {...request, ...(request.url ? {url: scrubUrl(request.url)} : {})},
	}
}
