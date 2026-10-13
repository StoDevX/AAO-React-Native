import {
	fetchManifest,
	fetchSourceBody,
	REL_ORG_CATEGORIES,
	resolveSources,
} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import type {OrgCategoryType} from './types'
import {campusWithSection} from '../../campuses'
import {currentCampusId} from '../campus/store'

const ORG_CATEGORIES_TYPE = 'application/vnd.frogpond.org-categories+json'

export const keys = {
	all: ['org-category-icons'] as const,
}

// Curated icon/gradient data changes on the order of weeks, matching the
// 5-minute staleTime precedent set by directory/contacts-query.ts.
const staleTime = 1000 * 60 * 5

async function fetchCategoryIcons({signal}: {signal: AbortSignal}): Promise<OrgCategoryType[]> {
	let manifest = await fetchManifest(queryClient)
	let sources = resolveSources(manifest, REL_ORG_CATEGORIES, [ORG_CATEGORIES_TYPE])
	// The styles of the campus whose orgs the screen lists, which a campus without a section
	// of its own borrows (see section-client.ts), read from that campus's server.
	let campus = campusWithSection('studentOrgs', currentCampusId())?.id
	let source = sources.find((each) => each.campus === campus)
	// No configured source at all means every category row falls back to
	// the generic icon and gray gradient -- categories.ts already handles
	// that for any name this returns nothing for, so this is not an error.
	if (!source) {
		return []
	}

	let body = await fetchSourceBody(
		source.href,
		signal,
		'Student Orgs categories',
		'json',
		source.campus,
	)
	// The server sends whatever data/org-categories.yaml published, so this
	// is an assertion, not a check -- same caveat as contacts-query.ts's
	// `icon`.
	return (body as {data: OrgCategoryType[]}).data
}

export const orgCategoryIconsOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchCategoryIcons,
	staleTime,
})
