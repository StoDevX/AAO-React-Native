import {
	fetchManifest,
	fetchSourceBody,
	REL_ORG_CATEGORIES,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import orgCategoriesData from '../../../docs/org-categories.json'
import type {OrgCategoryType} from './types'

const ORG_CATEGORIES_TYPE = 'application/vnd.frogpond.org-categories+json'

export const keys = {
	all: ['org-category-icons'] as const,
}

// Curated icon/gradient data changes on the order of weeks, matching the
// 5-minute staleTime precedent set by directory/contacts-query.ts.
const staleTime = 1000 * 60 * 5

async function fetchCategoryIcons({signal}: {signal: AbortSignal}): Promise<OrgCategoryType[]> {
	// Mirrors contacts-query.ts: UI tests read the bundled copy directly, so a
	// tile's icon and gradient in a screenshot match whatever this checkout
	// carries rather than whatever data/org-categories.yaml happens to
	// publish at test time.
	if (isUITesting) {
		return (orgCategoriesData as {data: OrgCategoryType[]}).data
	}

	let manifest = await fetchManifest(queryClient)
	let sources = resolveSources(manifest, REL_ORG_CATEGORIES, [ORG_CATEGORIES_TYPE])
	let source = sources[0]
	// No configured source at all means every category tile falls back to
	// the generic icon and gray gradient -- categories.ts already handles
	// that for any name this returns nothing for, so this is not an error.
	if (!source) {
		return []
	}

	let body = await fetchSourceBody(source.href, signal, 'Student Orgs categories')
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
