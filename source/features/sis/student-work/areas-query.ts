import {
	fetchManifest,
	fetchSourceBody,
	REL_STUDENT_WORK_AREAS,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'
import {queryClient} from '../../../init/tanstack-query'
import bundled from '../../../../docs/student-work-areas.json'
import {toAreas, type AreaEntry, type StudentWorkArea} from './areas'

const AREAS_TYPE = 'application/vnd.frogpond.student-work-areas+json'

/// The published file, checked before it is used: an entry missing its units
/// would crash every screen that counts it, while a rejected fetch leaves the
/// areas the query already has.
const PublishedAreasSchema = z.object({
	data: z.array(
		z.object({
			name: z.string().min(1),
			slug: z.string().min(1),
			icon: z.string().min(1),
			gradient: z.unknown(),
			units: z.array(z.string()).min(1),
		}),
	),
})

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
		return toAreas(PublishedAreasSchema.parse(body).data)
	},
	staleTime: 1000 * 60 * 5,
	// There from the start, since a query that has never run does not run
	// offline; marked stale so the live copy replaces them when it can.
	initialData: BUNDLED_AREAS,
	initialDataUpdatedAt: 0,
})
