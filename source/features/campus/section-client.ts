import {clientFor} from '@frogpond/api'

import {campusWithSection, type CampusDefinition} from '../../campuses'
import {sectionServer} from './section-server'
import {currentCampusId} from './store'

/** The sections that fetch from a campus server and may exist on one campus only. */
export type SectionWithServer = 'studentOrgs' | 'streaming' | 'athletics' | 'printing'

/**
 * The client for `key`'s server: the active campus's if it has the section,
 * else that of the campus that does. A one-campus screen opened by URL on
 * another campus, such as /student-orgs on Carleton, still loads.
 */
export function clientForSection(key: SectionWithServer): ReturnType<typeof clientFor> {
	let campus: CampusDefinition | undefined = campusWithSection(key, currentCampusId())
	if (!campus) {
		throw new Error(`No campus has a ${key} section`)
	}
	return clientFor(sectionServer(campus.id, campus[key]))
}
