import {
	fetchManifest,
	fetchSourceBody,
	REL_MAP_CATEGORIES,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'

import {queryClient} from '../../init/tanstack-query'
import mapCategoriesData from '../../../docs/map-categories.json'
import type {MapCategoryTable} from './lib/category-groups'

const MAP_CATEGORIES_TYPE = 'application/vnd.frogpond.map-categories+json'

/// The copy this build shipped with: what the grid draws before the first
/// fetch, offline, and under UI tests.
export const BUNDLED_MAP_CATEGORIES = (mapCategoriesData as {data: MapCategoryTable}).data

export const keys = {
	all: ['map-categories'] as const,
}

/// Groups change on the order of terms; five minutes matches the other
/// curated files (see student-orgs/category-icons-query.ts).
const staleTime = 1000 * 60 * 5

async function fetchMapCategories({signal}: {signal: AbortSignal}): Promise<MapCategoryTable> {
	// UI tests read the bundled copy, so a screenshot's tiles match this
	// checkout rather than whatever is published at test time.
	if (isUITesting) {
		return BUNDLED_MAP_CATEGORIES
	}

	let manifest = await fetchManifest(queryClient)
	let source = resolveSources(manifest, REL_MAP_CATEGORIES, [MAP_CATEGORIES_TYPE])[0]
	if (!source) {
		return BUNDLED_MAP_CATEGORIES
	}

	let body = await fetchSourceBody(source.href, signal, 'Map categories')
	// data/_schemas/map-categories.yaml gates what is published, so this is
	// an assertion rather than a check.
	return (body as {data: MapCategoryTable}).data
}

export const mapCategoriesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchMapCategories,
	staleTime,
})
