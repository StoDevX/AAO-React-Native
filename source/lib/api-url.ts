import {campusRoot} from '@frogpond/api'

import {campusById, type CampusId} from '../campuses'

/**
 * The address a source's href names, for a fetch that does not go through
 * `clientFor`. A relative href resolves against `campus`'s configured server,
 * an absolute one is returned as it is.
 *
 * Read when the address is needed, not when a module loads: a saved server
 * address is read from storage after launch, and until it arrives, or where
 * boot has not run (Jest), the campus's default is the one to ask.
 */
export function apiUrl(campus: CampusId, href: string): string {
	let root = campusRoot(campus) ?? new URL(campusById(campus).api.defaultUrl)
	return new URL(href, root).toString()
}
