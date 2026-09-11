import type {Campus} from '../building-hours/query'
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
 * St. Olaf's own basemap, themed for the campus rather than merely covering it:
 * 79 layers against Carleton's general-purpose tileset, with its tiles, glyphs
 * and sprites served from the same origin.
 *
 * Built from StoDevX/campus-map-data. The Carleton style does render St. Olaf --
 * its bounds cover all of Northfield -- but it draws the campus as an anonymous
 * cluster of grey footprints.
 */
export const STOLAF_MAP_STYLE_URL = 'https://stolaf.dev/campus-map-data/style.json'

/** The basemap each campus draws. */
export function mapStyleUrl(campus: Campus): string {
	return campus === 'stolaf' ? STOLAF_MAP_STYLE_URL : MAP_STYLE_URL
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
