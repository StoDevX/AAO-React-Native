import {
	fetchManifest,
	fetchSourceBody,
	REL_MAP_CATEGORIES,
	resolveSources,
} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'

import {queryClient} from '../../init/tanstack-query'
import {campusIdFromPublished} from '../../campuses'
import type {CampusMapCategories, MapCategoryTable} from './lib/category-groups'

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

/// Each campus's entry is checked only for a campus this build has, so a file
/// naming a newer campus, in whatever shape, cannot fail the whole table.
const PublishedMapCategoriesSchema = z.object({
	data: z.record(z.string(), z.unknown()),
})

/// The table by campus id, or none if any known campus's entry is unreadable.
/// The published file still keys campuses as 2.9's release candidates read
/// them (`stolaf`, `carleton`); a table this build cached is keyed by id.
/// `campusIdFromPublished` reads both.
function byCampusId(data: Record<string, unknown>): MapCategoryTable | string {
	let table: MapCategoryTable = {}
	for (let [key, entry] of Object.entries(data)) {
		let campus = campusIdFromPublished(key)
		if (!campus) {
			continue
		}
		let parsed = CampusSchema.safeParse(entry)
		if (!parsed.success) {
			return `${key}: ${parsed.error.message}`
		}
		// An icon is checked as a string; whether it names an SF Symbol cannot be.
		table[campus] = parsed.data as CampusMapCategories
	}
	return table
}

export const keys = {
	all: ['map-categories'] as const,
}

/// Groups change on the order of terms; five minutes matches the other
/// curated files (see student-orgs/category-icons-query.ts).
const staleTime = 1000 * 60 * 5

async function fetchMapCategories({signal}: {signal: AbortSignal}): Promise<MapCategoryTable> {
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
	let table = byCampusId(parsed.data.data)
	if (typeof table === 'string') {
		throw new UnreadableMapCategoriesError(table)
	}
	return table
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
	if (!parsed.success) {
		return undefined
	}
	let byId = byCampusId(parsed.data.data)
	return typeof byId === 'string' ? undefined : byId
}

const MAX_FETCH_RETRIES = 3

export const mapCategoriesOptions = queryOptions({
	queryKey: keys.all,
	queryFn: fetchMapCategories,
	staleTime,
	select: readableMapCategories,
	retry: (failures, error) =>
		!(error instanceof UnreadableMapCategoriesError) && failures < MAX_FETCH_RETRIES,
})
