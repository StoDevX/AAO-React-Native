import type {ColorSchemeName} from 'react-native'
import type {MapCredit, MapSection} from './campus-section'
import type {Coordinate} from './types'

export type {MapCredit}

/**
 * The appearance a campus's basemap draws in. Dark only where the system is
 * dark and the campus has a dark style; a campus without one stays light.
 */
export function basemapScheme(
	map: MapSection,
	scheme: ColorSchemeName | undefined,
): 'light' | 'dark' {
	return map.darkStyle !== undefined && scheme === 'dark' ? 'dark' : 'light'
}

const OSM_CREDIT: MapCredit = {
	label: '© OpenStreetMap contributors',
	url: 'https://www.openstreetmap.org/copyright',
}

/**
 * The credits a campus's map carries: the OpenStreetMap credit the tiles'
 * licence requires, then the college's. Shown by the map screen's own About
 * menu, since MapLibre's button is hidden.
 */
export function mapCredits(map: MapSection): Array<MapCredit> {
	return [OSM_CREDIT, map.credit]
}

/**
 * The same tileset as a single PMTiles archive, which MapLibre resolves over
 * HTTP range requests instead of a request per tile.
 *
 * Not the default because it is unproven here: PMTiles support in MapLibre
 * Native is the compile-time `MLN_WITH_PMTILES` flag rather than a registered
 * protocol, and iOS consumes a prebuilt MapLibre.xcframework over Swift Package
 * Manager -- so nothing in this repo can turn it on, and whether the shipped
 * binary already has it is unknown. Point Carleton's `map.style` here on a device to
 * find out; if tiles draw, this is the better URL.
 */
export const MAP_STYLE_URL_PMTILES = 'https://carls-app.github.io/map-tiles/style-pmtiles.json'

/** A building's photo, from the bare filename the map feed stores, under its campus's `photoRoot`. */
export function buildingPhotoUrl(root: string, filename: string): string {
	return `${root}/${filename}`
}

/**
 * A search for an address in Maps.
 *
 * A universal link rather than the `maps://` scheme: iOS hands this straight
 * to Maps.app, and a device without it still lands somewhere sensible.
 */
export function appleMapsSearchUrl(address: string): string {
	return `https://maps.apple.com/?q=${encodeURIComponent(address)}`
}

/**
 * Walking directions to a point in Maps: campus is walked, and `dirflg=w`
 * asks for walking rather than driving. `daddr` takes "latitude,longitude";
 * GeoJSON stores the pair the other way round.
 */
export function appleMapsDirectionsUrl([longitude, latitude]: Coordinate): string {
	return `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`
}
