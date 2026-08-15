import {client} from '@frogpond/api'

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

/// Fetches and parses the body of a resolved source, dispatching on whether
/// its href is absolute. A relative href goes through `client`, which
/// resolves against the configured api root (honouring the Settings
/// server-URL override and mDNS discovery). An absolute href bypasses the
/// api root by design.
export async function fetchSourceBody(
	href: string,
	signal: AbortSignal,
	label: string,
): Promise<unknown> {
	if (!isAbsoluteHref(href)) {
		return client.get(href, {signal}).json()
	}

	let response = await fetch(href, {signal})
	if (!response.ok) {
		throw new Error(`${label} fetch failed: ${response.status}`)
	}

	return response.json()
}
