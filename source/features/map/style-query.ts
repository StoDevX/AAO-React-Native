import {fetchManifest, REL_MAP_STYLE, resolveSource} from '@frogpond/data-sources'
import {queryOptions, useQuery} from '@tanstack/react-query'
import type {ColorSchemeName} from 'react-native'
import type {Campus} from '../building-hours/types'
import {queryClient} from '../../init/tanstack-query'
import {apiUrl} from '../../lib/api-url'
import {basemapScheme, MAP_STYLE_URL} from './urls'

export const MAP_STYLE_TYPE = 'application/vnd.maplibre.style+json'

/// The source id of each appearance of St. Olaf's basemap in the manifest.
const STOLAF_STYLE_IDS = {light: 'stolaf-light', dark: 'stolaf-dark'} as const

/// Resolving against a manifest with no links gives the shipped entry, which
/// is the address the map draws from until the published manifest arrives.
const SHIPPED = {subject: '', links: []}

function shippedHref(scheme: 'light' | 'dark'): string {
	return resolveSource(SHIPPED, REL_MAP_STYLE, STOLAF_STYLE_IDS[scheme], [MAP_STYLE_TYPE]).href
}

/// Where St. Olaf's basemap style is, as the published manifest says. The
/// shipped entry is the query's initial data, so the map has an address to
/// draw from before -- or without -- a fetch, and a published one replaces it
/// without a release.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const stolafMapStyleOptions = (scheme: 'light' | 'dark') =>
	queryOptions({
		queryKey: ['map-style', 'stolaf', scheme] as const,
		queryFn: async (): Promise<string> => {
			let manifest = await fetchManifest(queryClient)
			return resolveSource(manifest, REL_MAP_STYLE, STOLAF_STYLE_IDS[scheme], [MAP_STYLE_TYPE]).href
		},
		staleTime: 1000 * 60 * 60 * 24,
		initialData: shippedHref(scheme),
		initialDataUpdatedAt: 0,
	})

/// The basemap style a campus's map draws, in the system's appearance where
/// the campus can. A relative address names ccc-server, so it is resolved
/// against the configured server when drawn.
export function useMapStyleUrl(campus: Campus, scheme: ColorSchemeName | undefined): string {
	let {data: href} = useQuery(stolafMapStyleOptions(basemapScheme(campus, scheme)))
	return campus === 'stolaf' ? apiUrl(href) : MAP_STYLE_URL
}
