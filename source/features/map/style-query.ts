import {fetchManifest, hasBundledSource, REL_MAP_STYLE, resolveSource} from '@frogpond/data-sources'
import {queryOptions, useQuery} from '@tanstack/react-query'
import type {ColorSchemeName} from 'react-native'
import {queryClient} from '../../init/tanstack-query'
import type {CampusId} from '../../campuses/ids'
import {apiUrl} from '../../lib/api-url'
import {sectionServer} from '../campus/section-server'
import type {MapSection} from './campus-section'
import {basemapScheme} from './urls'

export const MAP_STYLE_TYPE = 'application/vnd.maplibre.style+json'

/// Resolving against a manifest with no links gives the shipped entry, which
/// is the address the map draws from until the published manifest arrives.
const SHIPPED = {subject: '', links: []}

/// Where a manifest-named basemap style is, as the published manifest says.
/// The shipped entry is the query's initial data, so the map has an address
/// to draw from before -- or without -- a fetch, and a published one replaces
/// it without a release.
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const manifestMapStyleOptions = (id: string) =>
	queryOptions({
		queryKey: ['map-style', id] as const,
		queryFn: async (): Promise<string> => {
			let manifest = await fetchManifest(queryClient)
			return resolveSource(manifest, REL_MAP_STYLE, id, [MAP_STYLE_TYPE]).href
		},
		staleTime: 1000 * 60 * 60 * 24,
		initialData: hasBundledSource(REL_MAP_STYLE, id)
			? resolveSource(SHIPPED, REL_MAP_STYLE, id, [MAP_STYLE_TYPE]).href
			: undefined,
		initialDataUpdatedAt: 0,
	})

/// The basemap style a campus's map draws, in the system's appearance where
/// the campus can. A manifest style's relative address names ccc-server, so
/// it is resolved against the map section's server (the campus's own unless
/// the section names another) when drawn.
export function useMapStyleUrl(
	campus: CampusId,
	map: MapSection,
	scheme: ColorSchemeName | undefined,
): string {
	let style = basemapScheme(map, scheme) === 'dark' && map.darkStyle ? map.darkStyle : map.style
	let manifestId = 'manifestId' in style ? style.manifestId : null
	let {data: href} = useQuery({
		...manifestMapStyleOptions(manifestId ?? ''),
		enabled: manifestId !== null,
	})
	if (!('manifestId' in style)) {
		return style.url
	}
	return href === undefined ? '' : apiUrl(sectionServer(campus, map), href)
}
