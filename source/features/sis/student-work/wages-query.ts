import {fetchSourceBody, REL_STUDENT_WAGES} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {studentWorkSource} from './source'
import {PublishedWagesSchema, type HourlyWages} from './wages'

const WAGES_TYPE = 'application/vnd.frogpond.student-wages+json'

/// Student wages as published. Until they load, pay is left off a posting
/// rather than guessed.
export const studentWagesOptions = queryOptions({
	queryKey: ['student-wages'] as const,
	queryFn: async ({signal}): Promise<HourlyWages> => {
		let source = await studentWorkSource(REL_STUDENT_WAGES, [WAGES_TYPE])
		let body = await fetchSourceBody(source.href, signal, 'Student wages', 'json', source.campus)
		return PublishedWagesSchema.parse(body).data
	},
	staleTime: 1000 * 60 * 5,
})
