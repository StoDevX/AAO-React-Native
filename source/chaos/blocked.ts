import {OLECARD_AUTH_URL} from '../lib/financials/urls'
import {PAPERCUT} from '../lib/stoprint/urls'

const PAPERCUT_HOST = new URL(PAPERCUT).host

/**
 * URLs a chaos run must never reach: they take real credentials, and a monkey
 * typing junk into a sign-in form would send it to the college's servers.
 */
export function isBlockedUrl(url: string): boolean {
	if (url === OLECARD_AUTH_URL) {
		return true
	}
	try {
		return new URL(url).host.toLowerCase() === PAPERCUT_HOST
	} catch {
		return false
	}
}
