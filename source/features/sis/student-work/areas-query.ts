import {
	fetchManifest,
	fetchSourceBody,
	REL_STUDENT_WORK_AREAS,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../../init/tanstack-query'
import bundled from '../../../../docs/student-work-areas.json'
import {toAreas, type AreaEntry, type StudentWorkArea} from './areas'

const AREAS_TYPE = 'application/vnd.frogpond.student-work-areas+json'

const BUNDLED_AREAS = toAreas((bundled as {data: AreaEntry[]}).data)

/// The areas as published, or the copy the app shipped with when that cannot
/// be fetched: a stale mapping still draws tiles, and no mapping draws none.
export const studentWorkAreasOptions = queryOptions({
	queryKey: ['student-work-areas'] as const,
	queryFn: async ({signal}): Promise<StudentWorkArea[]> => {
		if (isUITesting) return BUNDLED_AREAS

		try {
			let manifest = await fetchManifest(queryClient)
			let source = resolveSources(manifest, REL_STUDENT_WORK_AREAS, [AREAS_TYPE])[0]
			if (!source) return BUNDLED_AREAS

			let body = await fetchSourceBody(source.href, signal, 'Student Work areas')
			return toAreas((body as {data: AreaEntry[]}).data)
		} catch {
			return BUNDLED_AREAS
		}
	},
	staleTime: 1000 * 60 * 5,
})
