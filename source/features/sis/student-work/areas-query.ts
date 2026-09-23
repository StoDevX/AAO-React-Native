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

/// The areas as published. The copy the app shipped with is the query's
/// initial data, so a fetch that fails leaves whichever areas it already
/// has -- shipped or published -- rather than passing the shipped copy off as
/// the live one.
export const studentWorkAreasOptions = queryOptions({
	queryKey: ['student-work-areas'] as const,
	queryFn: async ({signal}): Promise<StudentWorkArea[]> => {
		if (isUITesting) return BUNDLED_AREAS

		let manifest = await fetchManifest(queryClient)
		let source = resolveSources(manifest, REL_STUDENT_WORK_AREAS, [AREAS_TYPE])[0]
		if (!source) return BUNDLED_AREAS

		let body = await fetchSourceBody(source.href, signal, 'Student Work areas')
		return toAreas((body as {data: AreaEntry[]}).data)
	},
	staleTime: 1000 * 60 * 5,
	// There from the start, since a query that has never run does not run
	// offline; marked stale so the live copy replaces them when it can.
	initialData: BUNDLED_AREAS,
	initialDataUpdatedAt: 0,
})
