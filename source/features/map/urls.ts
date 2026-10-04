import type {ColorSchemeName} from 'react-native'
import type {Campus} from '../building-hours/types'
import type {Coordinate} from './types'
/**
 * The MapLibre style JSON the campus map renders, self-hosted from
 * carls-app/map-tiles: OSM-derived vector tiles covering Northfield, plus the
 * glyph ranges and sprite sheet the style references.
 *
 * This is the z/x/y variant. It asks nothing special of the renderer, which is
 * why it is the default.
 */
export const MAP_STYLE_URL = 'https://carls-app.github.io/map-tiles/style.json'

/**
 * The appearance a campus's basemap draws in. Dark only where the system is
 * dark and the campus has a dark style: Carleton's has none, so its map stays
 * light either way.
 */
export function basemapScheme(
	campus: Campus,
	scheme: ColorSchemeName | undefined,
): 'light' | 'dark' {
	return campus === 'stolaf' && scheme === 'dark' ? 'dark' : 'light'
}

/// A credit the map shows, and where it leads.
export type MapCredit = {label: string; url: string}

/**
 * The credits a campus's map carries, as its style's sources state them: the
 * OpenStreetMap credit the tiles' licence requires, then the college's.
 * Shown by the map screen's own About menu, since MapLibre's button is hidden.
 */
export function mapCredits(campus: Campus): Array<MapCredit> {
	let osm = {label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright'}
	return campus === 'stolaf'
		? [osm, {label: 'St. Olaf College', url: 'https://wp.stolaf.edu/'}]
		: [osm, {label: 'Carleton College', url: 'https://www.carleton.edu/'}]
}

/**
 * The same tileset as a single PMTiles archive, which MapLibre resolves over
 * HTTP range requests instead of a request per tile.
 *
 * Not the default because it is unproven here: PMTiles support in MapLibre
 * Native is the compile-time `MLN_WITH_PMTILES` flag rather than a registered
 * protocol, and iOS consumes a prebuilt MapLibre.xcframework over Swift Package
 * Manager -- so nothing in this repo can turn it on, and whether the shipped
 * binary already has it is unknown. Point MAP_STYLE_URL here on a device to
 * find out; if tiles draw, this is the better URL.
 */
export const MAP_STYLE_URL_PMTILES = 'https://carls-app.github.io/map-tiles/style-pmtiles.json'

/**
 * Where a building's photos live.
 *
 * ccc-server stores `photos` as bare filenames -- `leighton.jpg` -- rather than
 * URLs, so a record is useless without this prefix. The images are carls-app/
 * map-data's scrape of Carleton's map, published to the same GitHub Pages site
 * as the tiles.
 */
const BUILDING_PHOTO_ROOT = 'https://carls-app.github.io/map-data/cache/img'

export function buildingPhotoUrl(filename: string): string {
	return `${BUILDING_PHOTO_ROOT}/${filename}`
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
