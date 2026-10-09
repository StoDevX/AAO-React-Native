import {campusWithSection, type CampusId} from '../../campuses'
import {useCampusId} from '../campus/store'
import {sectionServer} from '../campus/section-server'
import type {DirectorySection} from './campus-section'

/**
 * The directory the Directory screens search: the active campus's, else the
 * first campus with one. /directory is reachable by URL on every campus, and
 * showed St. Olaf's on all of them before campuses had definitions.
 */
export function useDirectory(): {campus: CampusId; directory: DirectorySection; server: CampusId} {
	let host = campusWithSection('directory', useCampusId())
	let directory = host?.directory
	if (!host || !directory) {
		throw new Error('No campus has a directory, but app/directory/ is still a route')
	}
	return {campus: host.id, directory, server: sectionServer(host.id, directory)}
}
