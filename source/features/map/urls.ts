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
export const MAP_STYLE_URL_PMTILES =
	'https://carls-app.github.io/map-tiles/style-pmtiles.json'
