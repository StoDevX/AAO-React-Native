import {
	fetchManifest,
	fetchSourceBody,
	REL_STUDENT_WAGES,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../../init/tanstack-query'
import {FIXED_WAGES} from './fixed-wages'
import {PublishedWagesSchema, type HourlyWages} from './wages'

const WAGES_TYPE = 'application/vnd.frogpond.student-wages+json'

/// Student wages as published. Until they load, pay is left off a posting
/// rather than guessed. UI tests get fixed rates throughout.
export const studentWagesOptions = queryOptions({
	queryKey: ['student-wages'] as const,
	queryFn: async ({signal}): Promise<HourlyWages> => {
		if (isUITesting) return FIXED_WAGES

		let manifest = await fetchManifest(queryClient)
		let source = resolveSources(manifest, REL_STUDENT_WAGES, [WAGES_TYPE])[0]
		if (!source) throw new Error('student-wages: the manifest lists no source')

		let body = await fetchSourceBody(source.href, signal, 'Student wages')
		return PublishedWagesSchema.parse(body).data
	},
	staleTime: 1000 * 60 * 5,
	// UI tests' fixed rates are there from the start, marked stale.
	initialData: isUITesting ? FIXED_WAGES : undefined,
	initialDataUpdatedAt: 0,
})
