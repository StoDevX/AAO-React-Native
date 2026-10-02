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
 * Breadcrumbs dropped outright: console output holds whatever the app logged,
 * and a touch or rage-tap breadcrumb names the text under the finger.
 */
const DROPPED_CATEGORIES: ReadonlySet<string> = new Set(['console', 'touch', 'ui.multiClick'])

/**
 * Drops breadcrumbs that can hold free text, and scrubs the URL and query
 * fields on request breadcrumbs.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
	if (breadcrumb.category !== undefined && DROPPED_CATEGORIES.has(breadcrumb.category)) {
		return null
	}
	let data = breadcrumb.data
	if (!data || !(typeof data.url === 'string' || QUERY_FIELDS.some((field) => field in data))) {
		return breadcrumb
	}
	let scrubbed = {...data}
	for (let field of QUERY_FIELDS) {
		delete scrubbed[field]
	}
	if (typeof scrubbed.url === 'string') {
		scrubbed.url = scrubUrl(scrubbed.url)
	}
	return {...breadcrumb, data: scrubbed}
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
 * Scrubs what an error or failed-request event carries beyond its own
 * message: the request (URL, query string, cookies), the breadcrumbs --
 * including the native SDK's, which JS `beforeBreadcrumb` never sees -- and
 * the device app hash, which survives opting out and back in.
 */
export function scrubEvent<E extends Event>(event: E): E {
	let scrubbed: E = {...event}
	let changed = false

	if (event.request) {
		let {query_string: _query, cookies: _cookies, ...request} = event.request
		scrubbed.request = {...request, ...(request.url ? {url: scrubUrl(request.url)} : {})}
		changed = true
	}

	if (event.breadcrumbs) {
		scrubbed.breadcrumbs = event.breadcrumbs
			.map(scrubBreadcrumb)
			.filter((crumb): crumb is Breadcrumb => crumb !== null)
		changed = true
	}

	let app = event.contexts?.app
	if (app && 'device_app_hash' in app) {
		let {device_app_hash: _hash, ...rest} = app
		scrubbed.contexts = {...event.contexts, app: rest}
		changed = true
	}

	return changed ? scrubbed : event
}
