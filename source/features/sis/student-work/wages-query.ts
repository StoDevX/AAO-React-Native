import {
	fetchManifest,
	fetchSourceBody,
	REL_STUDENT_WAGES,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../../init/tanstack-query'
import bundled from '../../../../docs/student-wages.json'
import {FIXED_WAGES} from './fixed-wages'
import {PublishedWagesSchema, type HourlyWages} from './wages'

const WAGES_TYPE = 'application/vnd.frogpond.student-wages+json'

const BUNDLED_WAGES: HourlyWages = PublishedWagesSchema.parse(bundled).data

/// Student wages as published. The copy the app shipped with is the query's
/// initial data, so a fetch that fails leaves whichever wages it already
/// has -- shipped or published -- rather than passing the shipped copy off as
/// the live one. UI tests get fixed rates throughout.
export const studentWagesOptions = queryOptions({
	queryKey: ['student-wages'] as const,
	queryFn: async ({signal}): Promise<HourlyWages> => {
		if (isUITesting) return FIXED_WAGES

		let manifest = await fetchManifest(queryClient)
		let source = resolveSources(manifest, REL_STUDENT_WAGES, [WAGES_TYPE])[0]
		if (!source) return BUNDLED_WAGES

		let body = await fetchSourceBody(source.href, signal, 'Student wages')
		return PublishedWagesSchema.parse(body).data
	},
	staleTime: 1000 * 60 * 5,
	// There from the start, since a query that has never run does not run
	// offline; marked stale so the live copy replaces them when it can.
	initialData: isUITesting ? FIXED_WAGES : BUNDLED_WAGES,
	initialDataUpdatedAt: 0,
})
