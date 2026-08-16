import {client} from '@frogpond/api'

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

/// Fetches and parses the body of a resolved source, dispatching on whether
/// its href is absolute. A relative href goes through `client`, which
/// resolves against the configured api root (honouring the Settings
/// server-URL override and mDNS discovery) and already carries ky's 10-second
/// default timeout. An absolute href bypasses the api root by design, so it
/// gets the same 10-second timeout applied manually.
///
/// `format` picks the body parser: `'json'` (the default) for sources like
/// WordPress's REST API, `'text'` for sources whose media type is not JSON —
/// RSS (`application/rss+xml`), for instance.
export async function fetchSourceBody(
	href: string,
	signal: AbortSignal,
	label: string,
	format: 'json' | 'text' = 'json',
): Promise<unknown> {
	if (!isAbsoluteHref(href)) {
		let request = client.get(href, {signal})
		return format === 'text' ? request.text() : request.json()
	}

	let response = await fetchWithTimeout(href, signal)
	if (!response.ok) {
		throw new Error(`${label} fetch failed: ${response.status}`)
	}

	return format === 'text' ? response.text() : response.json()
}
