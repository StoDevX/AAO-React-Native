import {fetchSourceBody, REL_STUDENT_WORK_AREAS} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'
import {toAreas, type StudentWorkArea} from './areas'
import {studentWorkSource} from './source'

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

/// What a screen draws with until the areas load. One array, so a memo keyed on it holds.
export const NO_AREAS: StudentWorkArea[] = []

/// The areas as published.
export const studentWorkAreasOptions = queryOptions({
	queryKey: ['student-work-areas'] as const,
	queryFn: async ({signal}): Promise<StudentWorkArea[]> => {
		let source = await studentWorkSource(REL_STUDENT_WORK_AREAS, [AREAS_TYPE])
		let body = await fetchSourceBody(
			source.href,
			signal,
			'Student Work areas',
			'json',
			source.campus,
		)
		return toAreas(PublishedAreasSchema.parse(body).data)
	},
	staleTime: 1000 * 60 * 5,
})
