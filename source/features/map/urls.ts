import {Platform, type ColorSchemeName} from 'react-native'
import type {MapCredit, MapSection} from './campus-section'
import type {Coordinate} from './types'

export type {MapCredit}

/**
 * The appearance a campus's basemap draws in. Dark only where the system is
 * dark and the campus has a dark style; a campus without one stays light.
 */
export function basemapScheme(
	map: MapSection,
	scheme: ColorSchemeName | null | undefined,
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
 * A search for an address in the device's maps app.
 *
 * iOS: a universal link rather than the `maps://` scheme, which iOS hands
 * straight to Maps.app; a device without it still lands somewhere sensible.
 * Android: a `geo:` URI, which opens whichever maps app the reader uses, or
 * asks them to choose, as Android's own apps do.
 */
export function mapsSearchUrl(address: string, os: string = Platform.OS): string {
	if (os === 'android') {
		return `geo:0,0?q=${encodeURIComponent(address)}`
	}
	return `https://maps.apple.com/?q=${encodeURIComponent(address)}`
}

/**
 * Walking directions to a point in the device's maps app: campus is walked.
 * GeoJSON stores the pair longitude first; both URLs take latitude first.
 *
 * iOS: Maps' `daddr`, with `dirflg=w` for walking. Android: Google's
 * cross-platform Maps URL, which opens the Google Maps app on Android (`geo:`
 * has no way to ask for directions).
 */
export function mapsDirectionsUrl(
	[longitude, latitude]: Coordinate,
	os: string = Platform.OS,
): string {
	if (os === 'android') {
		return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`
	}
	return `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`
}
