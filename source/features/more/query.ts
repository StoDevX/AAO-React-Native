import {
	fetchManifest,
	fetchSourceBody,
	REL_A_TO_Z,
	type ResolvedSource,
	resolveSources,
} from '@frogpond/data-sources'
import {queryOptions} from '@tanstack/react-query'
import {queryClient} from '../../init/tanstack-query'
import {parseAToZExtras, parseStolafAToZ} from './parsers/a-z-extras'
import {mergeAToZ} from './parsers/merge'
import {LinkGroup} from './types'

const STOLAF_A_Z = 'application/vnd.stolaf.a-z+json'
const A_Z_EXTRAS = 'application/vnd.frogpond.a-z-extras+json'

export const A_TO_Z_TYPES = [STOLAF_A_Z, A_Z_EXTRAS] as const

export const keys = {
	all: ['a-z'] as const,
}

function parse(type: string, body: unknown): LinkGroup[] {
	switch (type) {
		case STOLAF_A_Z:
			return parseStolafAToZ(body)
		case A_Z_EXTRAS:
			return parseAToZExtras(body)
		default:
			throw new Error(`no A–Z parser for "${type}"`)
	}
}

/** A source's groups, read from the server of the campus that lists it. */
async function fetchGroups(source: ResolvedSource, signal: AbortSignal): Promise<LinkGroup[]> {
	let body = await fetchSourceBody(source.href, signal, 'A–Z', 'json', source.campus)
	return parse(source.type, body)
}

export const searchLinksOptions = queryOptions({
	queryKey: keys.all,
	queryFn: async ({signal}): Promise<LinkGroup[]> => {
		let manifest = await fetchManifest(queryClient)
		let sources = resolveSources(manifest, REL_A_TO_Z, A_TO_Z_TYPES)

		let upstream = sources.find((source) => source.type === STOLAF_A_Z)
		if (!upstream) {
			throw new Error('no A–Z index source')
		}

		let upstreamGroups = await fetchGroups(upstream, signal)

		// The extras are a supplement; losing them should not blank the index.
		let extraGroups = await Promise.all(
			sources
				.filter((source) => source.type === A_Z_EXTRAS)
				.map((source) => fetchGroups(source, signal).catch(() => [] as LinkGroup[])),
		)

		return mergeAToZ(upstreamGroups, extraGroups.flat())
	},
})
