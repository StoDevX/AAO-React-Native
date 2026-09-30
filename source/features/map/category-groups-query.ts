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
	let table = (body as {data?: unknown}).data
	// The schema gates what this repo publishes today, not what an older
	// install can read. A shape it cannot read fails the fetch, so React
	// Query keeps what it had and the picker falls back to the bundled copy,
	// rather than the grid throwing during render.
	if (!isReadableTable(table)) {
		throw new Error('map-categories: the published file has a shape this build cannot read')
	}
	return table
}

function isReadableTable(value: unknown): value is MapCategoryTable {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	let {stolaf, carleton} = value as Record<string, unknown>
	return [stolaf, carleton].every(
		(entries) =>
			Array.isArray(entries) &&
			entries.every(
				(entry: {label?: unknown; categories?: unknown}) =>
					typeof entry?.label === 'string' && Array.isArray(entry.categories),
			),
	)
}

export const mapCategoriesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchMapCategories,
	staleTime,
})
