import {fetchManifest, fetchSourceBody, REL_JOBS, resolveSource} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../source/init/tanstack-query'
import {parseDetail} from './parsers/description'
import {parseCategories, parseRequisitions} from './parsers/requisitions'
import type {JobCategory, JobDetail} from './types'
import {categoriesUrl, detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from './urls'

const ORACLE_RECRUITING = 'application/vnd.oracle.recruiting-ce+json'
const SOURCE_TYPES = [ORACLE_RECRUITING]
const SOURCE_ID = 'stolaf'
const LABEL = 'Jobs'

export const keys = {
	postings: ['jobs', 'postings'] as const,
	detail: (id: string) => ['jobs', 'detail', id] as const,
}

async function resolveJobSite(): Promise<string> {
	let manifest = await fetchManifest(queryClient)
	return resolveSource(manifest, REL_JOBS, SOURCE_ID, SOURCE_TYPES).href
}

export const jobPostingsOptions = queryOptions({
	queryKey: keys.postings,
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
