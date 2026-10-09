import {getApiRoot} from '@frogpond/api'
import {DEFAULT_URL} from './constants'

/**
 * The address a source's href names, for a fetch that does not go through
 * `stolafClient`. A relative href resolves against the configured server, an
 * absolute one is returned as it is.
 *
 * Read when the address is needed, not when a module loads: the server address
 * is a setting read from storage after launch, and until it arrives the
 * default server is the one to ask.
 */
export function apiUrl(href: string): string {
	return new URL(href, getApiRoot() ?? new URL(DEFAULT_URL)).toString()
}
