import {clientFor} from '@frogpond/api'
import {queryOptions, type QueryClient} from '@tanstack/react-query'
import bundledJson from './bundled.json'
import {
	CAMPUS_PROPERTY,
	ID_PROPERTY,
	JrdSchema,
	type Jrd,
	type ResolvedSource,
	type SourceCampus,
} from './types'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

/// The copy shipped in the binary. Every fallback path resolves against this,
/// so it is always parseable and always uses types this build can handle.
const bundled: Jrd = JrdSchema.parse(bundledJson)

export const keys = {
	manifest: ['data-sources', 'manifest'] as const,
}

/// The manifest is published on St. Olaf's server for every campus.
const MANIFEST_SERVER: SourceCampus = 'edu.stolaf'

export const manifestOptions = queryOptions({
	queryKey: keys.manifest,
	staleTime: ONE_DAY_IN_MS,
	// Default `networkMode: 'online'` pauses the fetch (rather than rejecting
	// it) while `onlineManager` reports offline, so `fetchManifest`'s catch
	// below would never run and the promise would never settle. 'offlineFirst'
	// still runs the queryFn once even while offline, so ky can fail fast and
	// rule 1's fallback actually takes effect. Retries are paused the same
	// way a first attempt would be under 'online', so they're disabled here
	// too -- a single failed attempt should fall back to the bundled copy
	// immediately rather than wait offline for a retry that can't run.
	networkMode: 'offlineFirst',
	retry: false,
	// A failed refetch leaves the last manifest in the cache, and it is written
	// to storage as it is, so a failure on one launch does not leave the next
	// one with nothing cached. The radio plays from it however old it is.
	meta: {persistAfterFailure: true},
	queryFn: async ({signal}): Promise<Jrd> => {
		let response = await clientFor(MANIFEST_SERVER).get('sources', {signal}).json()
		return JrdSchema.parse(response)
	},
})

/// Rule 1: an unreachable or malformed manifest means we use the bundled one
/// wholesale. Resolution must never be the reason a feature fails to load.
export async function fetchManifest(queryClient: QueryClient): Promise<Jrd> {
	try {
		return await queryClient.query(manifestOptions)
	} catch {
		return bundled
	}
}

/// The manifest's campus names, as published (`carleton`) and as campus ids.
const CAMPUS_IDS = new Map<string, SourceCampus>([
	['stolaf', 'edu.stolaf'],
	['edu.stolaf', 'edu.stolaf'],
	['carleton', 'edu.carleton'],
	['edu.carleton', 'edu.carleton'],
])

/// A link's campus. Absent, or a campus this build does not know, is St. Olaf's,
/// the server a manifest entry names when it names none.
function campusOf(link: Jrd['links'][number]): SourceCampus {
	let named = link.properties[CAMPUS_PROPERTY]
	return (named === undefined ? undefined : CAMPUS_IDS.get(named)) ?? 'edu.stolaf'
}

function toResolved(link: Jrd['links'][number]): ResolvedSource {
	return {
		id: link.properties[ID_PROPERTY],
		href: link.href,
		type: link.type,
		title: link.titles?.['und'],
		campus: campusOf(link),
	}
}

function find(manifest: Jrd, rel: string, id: string): ResolvedSource | undefined {
	let link = manifest.links.find(
		(entry) => entry.rel === rel && entry.properties[ID_PROPERTY] === id,
	)
	return link ? toResolved(link) : undefined
}

/// Whether the bundled manifest has an entry for `rel` and `id`, of any type.
/// A source the build ships with is one the app relies on; one it does not is
/// optional, and only the published manifest may name it.
export function hasBundledSource(rel: string, id: string): boolean {
	return find(bundled, rel, id) !== undefined
}

/// Rules 2 and 3. A source that is missing, or that names a format this build
/// has no parser for, falls back to its bundled entry — so publishing a new
/// format tag cannot break installs that predate the parser. Rule 3 also
/// applies to the bundled entry itself: if this build can't parse that
/// either, that's a programming error (a shipped bundle using a type this
/// build doesn't support), and it should throw rather than hand back a
/// source the caller can't use.
export function resolveSource(
	manifest: Jrd,
	rel: string,
	id: string,
	supportedTypes: readonly string[],
): ResolvedSource {
	let fetched = find(manifest, rel, id)

	if (fetched && supportedTypes.includes(fetched.type)) {
		return fetched
	}

	let fallback = find(bundled, rel, id)
	if (!fallback || !supportedTypes.includes(fallback.type)) {
		throw new Error(`no supported source for rel "${rel}" and id "${id}"`)
	}

	return fallback
}

export function resolveSources(
	manifest: Jrd,
	rel: string,
	supportedTypes: readonly string[],
): ResolvedSource[] {
	let ids = new Set<string>()
	for (let link of [...manifest.links, ...bundled.links]) {
		if (link.rel === rel) ids.add(link.properties[ID_PROPERTY])
	}

	return [...ids].flatMap((id) => {
		try {
			return [resolveSource(manifest, rel, id, supportedTypes)]
		} catch {
			return []
		}
	})
}
