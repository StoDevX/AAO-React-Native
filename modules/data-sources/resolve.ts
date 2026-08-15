import {client} from '@frogpond/api'
import {queryOptions, type QueryClient} from '@tanstack/react-query'
import bundledJson from './bundled.json'
import {ID_PROPERTY, JrdSchema, type Jrd, type ResolvedSource} from './types'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

/// The copy shipped in the binary. Every fallback path resolves against this,
/// so it is always parseable and always uses types this build can handle.
const bundled: Jrd = JrdSchema.parse(bundledJson)

export const keys = {
	manifest: ['data-sources', 'manifest'] as const,
}

export const manifestOptions = queryOptions({
	queryKey: keys.manifest,
	staleTime: ONE_DAY_IN_MS,
	queryFn: async ({signal}): Promise<Jrd> => {
		let response = await client.get('sources', {signal}).json()
		return JrdSchema.parse(response)
	},
})

/// Rule 1: an unreachable or malformed manifest means we use the bundled one
/// wholesale. Resolution must never be the reason a feature fails to load.
export async function fetchManifest(queryClient: QueryClient): Promise<Jrd> {
	try {
		return await queryClient.fetchQuery(manifestOptions)
	} catch {
		return bundled
	}
}

function toResolved(link: Jrd['links'][number]): ResolvedSource {
	return {
		id: link.properties[ID_PROPERTY],
		href: link.href,
		type: link.type,
		title: link.titles?.['und'],
	}
}

function find(manifest: Jrd, rel: string, id: string): ResolvedSource | undefined {
	let link = manifest.links.find(
		(entry) => entry.rel === rel && entry.properties[ID_PROPERTY] === id,
	)
	return link ? toResolved(link) : undefined
}

/// Rules 2 and 3. A source that is missing, or that names a format this build
/// has no parser for, falls back to its bundled entry — so publishing a new
/// format tag cannot break installs that predate the parser.
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
	if (!fallback) {
		throw new Error(`no source for rel "${rel}" and id "${id}"`)
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
