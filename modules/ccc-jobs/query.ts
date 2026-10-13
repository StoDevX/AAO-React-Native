import {fetchSourceBody, REL_JOBS, REL_STUDENT_WORK_UNITS} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'
import {studentWorkSource} from '../../source/features/sis/student-work/source'
import {parseDetail} from './parsers/description'
import {parseCategories, parseRequisitions} from './parsers/requisitions'
import type {JobCategory, JobDetail} from './types'
import {categoriesUrl, detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from './urls'

const ORACLE_RECRUITING = 'application/vnd.oracle.recruiting-ce+json'
const SOURCE_TYPES = [ORACLE_RECRUITING]
const LABEL = 'Jobs'

export const keys = {
	postings: ['jobs', 'postings'] as const,
	detail: (id: string) => ['jobs', 'detail', id] as const,
	postingUnits: ['jobs', 'posting-units'] as const,
}

async function resolveJobSite(): Promise<string> {
	return (await studentWorkSource(REL_JOBS, SOURCE_TYPES)).href
}

export const jobPostingsOptions = queryOptions({
	queryKey: keys.postings,
	// Every Student Work screen reads the board, so going from the landing to
	// a list would otherwise refetch it; pull-to-refresh still does.
	staleTime: 5 * 60 * 1000,
	queryFn: async ({signal}): Promise<JobCategory[]> => {
		let href = await resolveJobSite()
		let site = parseSiteHref(href)

		let categories = parseCategories(await fetchSourceBody(categoriesUrl(site), signal, LABEL))

		// One request per category, because a requisition carries no category of
		// its own -- the only way to know which section a posting belongs to is
		// to ask for that section.
		return Promise.all(
			categories.map(async (category) => ({
				...category,
				jobs: parseRequisitions(
					await fetchSourceBody(requisitionsUrl(site, {categoryId: category.id}), signal, LABEL),
				),
			})),
		)
	},
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const jobDetailOptions = (id: string) =>
	queryOptions({
		queryKey: keys.detail(id),
		queryFn: async ({signal}): Promise<JobDetail> => {
			let href = await resolveJobSite()
			let site = parseSiteHref(href)

			return parseDetail(
				await fetchSourceBody(detailUrl(site, id), signal, LABEL),
				jobPageUrl(href, id),
			)
		},
	})

const UNITS_TYPE = 'application/vnd.frogpond.student-work-units+json'
const UNITS_LABEL = 'Student Work units'

const PostingUnitsSchema = z.record(z.string(), z.string().nullable())

/// Each board posting's unit by posting ID, from ccc-server. A posting the
/// server could not read is absent; one whose unit no area lists, or that
/// names none, is "other" (older servers sent the unit, or null).
export type PostingUnits = z.infer<typeof PostingUnitsSchema>

/// One hour, as long as ccc-server caches its answer.
const POSTING_UNITS_STALE_TIME = 60 * 60 * 1000

export const postingUnitsOptions = queryOptions({
	queryKey: keys.postingUnits,
	staleTime: POSTING_UNITS_STALE_TIME,
	queryFn: async ({signal}): Promise<PostingUnits> => {
		let source = await studentWorkSource(REL_STUDENT_WORK_UNITS, [UNITS_TYPE])
		return PostingUnitsSchema.parse(
			await fetchSourceBody(source.href, signal, UNITS_LABEL, 'json', source.campus),
		)
	},
})
