import {
	fetchManifest,
	fetchSourceBody,
	REL_MAP_CATEGORIES,
	resolveSources,
} from '@frogpond/data-sources'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'

import {queryClient} from '../../init/tanstack-query'
import mapCategoriesData from '../../../docs/map-categories.json'
import type {MapCategoryTable} from './lib/category-groups'

const MAP_CATEGORIES_TYPE = 'application/vnd.frogpond.map-categories+json'

/// What this build can read of the published file. `icon` and `gradient` may
/// be missing -- `groupsFor` falls back for both -- but never another type:
/// an icon that is not a string would reach the grid's SF Symbol.
const MapCategoryEntrySchema = z.object({
	label: z.string().min(1),
	categories: z.array(z.string()),
	icon: z.string().min(1).optional(),
	gradient: z.string().optional(),
})

const MapIconEntrySchema = MapCategoryEntrySchema.omit({label: true})

const CampusSchema = z.object({
	groups: z.array(MapCategoryEntrySchema),
	icons: z.array(MapIconEntrySchema),
})

const PublishedMapCategoriesSchema = z.object({
	data: z.object({stolaf: CampusSchema, carleton: CampusSchema}),
})

/// This checkout's copy, which UI tests read in place of the published one.
const UITEST_MAP_CATEGORIES = (mapCategoriesData as {data: MapCategoryTable}).data

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
		return UITEST_MAP_CATEGORIES
	}

	let manifest = await fetchManifest(queryClient)
	let source = resolveSources(manifest, REL_MAP_CATEGORIES, [MAP_CATEGORIES_TYPE])[0]
	if (!source) {
		throw new Error('map-categories: the manifest lists no source')
	}

	let body = await fetchSourceBody(source.href, signal, 'Map categories')
	// The schema in data/_schemas gates what this repo publishes today, not
	// what an older install can read, so the file is checked again here: a
	// shape this build cannot read fails the fetch, leaving the table the
	// query already has, rather than reaching the grid and failing there.
	let parsed = PublishedMapCategoriesSchema.safeParse(body)
	if (!parsed.success) {
		throw new UnreadableMapCategoriesError(parsed.error.message)
	}
	// An icon is checked as a string; whether it names an SF Symbol cannot be.
	return parsed.data.data as MapCategoryTable
}

/// A published file of a shape this build cannot read. It fails the same way
/// on every fetch, so it is never retried.
class UnreadableMapCategoriesError extends Error {
	constructor(detail: string) {
		super(`map-categories: the published file has a shape this build cannot read: ${detail}`)
	}
}

/// The cached table if this build can read it, else none. A
/// table restored from the persisted cache never passed through
/// `fetchMapCategories`, so one an older build saved in an older shape would
/// otherwise reach the picker unchecked.
function readableMapCategories(table: unknown): MapCategoryTable | undefined {
	let parsed = PublishedMapCategoriesSchema.safeParse({data: table})
	return parsed.success ? (parsed.data.data as MapCategoryTable) : undefined
}

const MAX_FETCH_RETRIES = 3

export const mapCategoriesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchMapCategories,
	staleTime,
	select: readableMapCategories,
	// UI tests' copy is there from the start, marked stale.
	initialData: isUITesting ? UITEST_MAP_CATEGORIES : undefined,
	initialDataUpdatedAt: 0,
	retry: (failures, error) =>
		!(error instanceof UnreadableMapCategoriesError) && failures < MAX_FETCH_RETRIES,
})
