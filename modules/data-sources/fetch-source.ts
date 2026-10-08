import {carletonClient, stolafClient, isHTTPError} from '@frogpond/api'
import type {SourceCampus} from './types'

const FETCH_TIMEOUT_MS = 10_000

/// A relative href (e.g. `news/named/mess`) names a proxied source and
/// resolves against the configured api root; an absolute href names a
/// source this app talks to directly. `URL.canParse` would be the obvious
/// check, but react-native's `URL` (Libraries/Blob/URL.js) is a from-scratch
/// implementation with no `canParse` static, so this tests for a URI scheme
/// directly (RFC 3986 §3.1) instead of relying on a runtime API.
const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/iu

export function isAbsoluteHref(href: string): boolean {
	return SCHEME_PATTERN.test(href)
}

/// This runtime's `AbortSignal` comes from react-native's `abort-controller`
/// polyfill (`abort-controller@3.0.0`, wired up in
/// react-native/Libraries/Core/setUpXHR.js), not from a JS engine that
/// implements the newer spec -- that polyfill predates the
/// `AbortSignal.any`/`AbortSignal.timeout` statics. Node's own AbortSignal
/// does have them, so code that used them would pass under Jest and then
/// silently never time out on device. A manual controller, wired to both the
/// caller's signal and a timer, is the only implementation this runtime
/// actually supports.
async function fetchWithTimeout(href: string, signal: AbortSignal): Promise<Response> {
	let controller = new AbortController()

	let abort = () => controller.abort()
	if (signal.aborted) abort()
	signal.addEventListener('abort', abort)

	let timer = setTimeout(abort, FETCH_TIMEOUT_MS)

	try {
		return await fetch(href, {signal: controller.signal})
	} finally {
		clearTimeout(timer)
		signal.removeEventListener('abort', abort)
	}
}

/// A source, absolute or relative, that answered with an error status. It carries the status,
/// and the `code` a WordPress error body names (`rest_post_invalid_page_number`), so a caller can
/// tell one kind of refusal from another. A relative source's `cause` is ky's error, which names
/// the URL.
export class SourceFetchError extends Error {
	readonly code: string | undefined

	constructor(
		message: string,
		readonly status: number,
		{code, cause}: {code?: string | undefined; cause?: unknown} = {},
	) {
		super(message, {cause})
		this.name = 'SourceFetchError'
		this.code = code
	}
}

/// The `code` a WordPress error body names, or undefined for any other body.
function wordpressCode(body: unknown): string | undefined {
	if (typeof body !== 'object' || body === null || !('code' in body)) return undefined
	return typeof body.code === 'string' ? body.code : undefined
}

/// An error body read as JSON, or undefined when it is not JSON. React Native's
/// `fetch` (whatwg-fetch over XHR) resolves only once the whole body has
/// arrived, inside `fetchWithTimeout`'s timer, so this reads what is already in
/// memory and needs no bound of its own.
async function errorBody(response: Response): Promise<unknown> {
	if (!response.headers.get('content-type')?.includes('json')) return undefined
	try {
		return JSON.parse(await response.text()) as unknown
	} catch {
		return undefined
	}
}

/// Fetches and parses the body of a resolved source, dispatching on whether
/// its href is absolute. A relative href goes through `stolafClient`, which
/// resolves against the configured api root (honouring the Settings
/// server-URL override and mDNS discovery) and already carries ky's 10-second
/// default timeout. An absolute href bypasses the api root by design, so it
/// gets the same 10-second timeout applied manually. An error status from
/// either kind throws `SourceFetchError`.
///
/// `format` picks the body parser: `'json'` (the default) for sources like
/// WordPress's REST API, `'text'` for sources whose media type is not JSON —
/// RSS (`application/rss+xml`), for instance.
///
/// `campus` picks the server a relative href resolves against: St. Olaf's api
/// root by default, or Carleton's, which has a server setting of its own.
export async function fetchSourceBody(
	href: string,
	signal: AbortSignal,
	label: string,
	format: 'json' | 'text' = 'json',
	campus: SourceCampus = 'stolaf',
): Promise<unknown> {
	if (!isAbsoluteHref(href)) {
		try {
			let api = campus === 'carleton' ? carletonClient : stolafClient
			let request = api.get(href, {signal})
			return await (format === 'text' ? request.text() : request.json())
		} catch (error) {
			// The same error an absolute source's refusal throws, so a caller reads a
			// proxied source's status the way it reads a direct one's.
			if (isHTTPError(error)) {
				let {status} = error.response
				throw new SourceFetchError(`${label} fetch failed: ${status}`, status, {
					code: wordpressCode(error.data),
					cause: error,
				})
			}
			throw error
		}
	}

	let response = await fetchWithTimeout(href, signal)
	if (!response.ok) {
		let code = wordpressCode(await errorBody(response))
		throw new SourceFetchError(`${label} fetch failed: ${response.status}`, response.status, {
			code,
		})
	}

	return format === 'text' ? response.text() : response.json()
}
