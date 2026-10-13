import {fetchManifest, resolveSource, type ResolvedSource} from '@frogpond/data-sources'

import {campusWithSection} from '../../../campuses'
import {queryClient} from '../../../init/tanstack-query'
import {currentCampusId} from '../../campus/store'

/**
 * The manifest's entry under `rel` for the Student Work of the campus in use, or of the
 * campus that has the section when this one does not. A relative href is read from the
 * entry's own campus server, which `campus` names.
 */
export async function studentWorkSource(
	rel: string,
	types: readonly string[],
): Promise<ResolvedSource> {
	let section = campusWithSection('studentWork', currentCampusId())?.studentWork
	if (!section) {
		throw new Error('No campus has a studentWork section')
	}
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, rel, section.source, types)
}
