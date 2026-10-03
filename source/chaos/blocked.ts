import {OLECARD_AUTH_URL} from '../lib/financials/urls'
import {PAPERCUT} from '../lib/stoprint/urls'

const PAPERCUT_HOST = new URL(PAPERCUT).host

/** A URL's origin and path, which `URL` gives with its host in lowercase. */
function page(url: URL): string {
	return `${url.origin}${url.pathname}`
}

const OLECARD_AUTH_PAGE = page(new URL(OLECARD_AUTH_URL))

/**
 * URLs a chaos run must never reach: they take real credentials, and a monkey
 * typing junk into a sign-in form would send it to the college's servers.
 * The OleCard sign-in is matched by page, whatever its query or fragment.
 */
export function isBlockedUrl(url: string): boolean {
	let parsed
	try {
		parsed = new URL(url)
	} catch {
		return false
	}
	return page(parsed) === OLECARD_AUTH_PAGE || parsed.host.toLowerCase() === PAPERCUT_HOST
}
