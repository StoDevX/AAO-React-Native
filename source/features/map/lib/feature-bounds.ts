import type {LngLatBounds} from '@maplibre/maplibre-react-native'
import type {Building, Coordinate, Feature} from '../types'

/**
 * The smallest box containing every coordinate in a feature's geometry, in
 * the west/south/east/north order MapLibre's `Camera` bounds want.
 *
 * Framing the camera on this rather than a fixed zoom is what makes a small
 * building and a sprawling one both fill the cutout sensibly: a large
 * building's bounds are wide, so the camera backs off further to fit them.
 *
 * Returns `undefined` only for a feature carrying no coordinates whatsoever.
 * A points-only record yields a real but zero-area box, which MapLibre fits by
 * clamping to maximum zoom -- a blank tile, not a building. A caller that needs
 * something worth framing should ask whether there is a footprint first; see
 * `BuildingCutout`.
 */
export function featureBounds(feature: Feature<Building>): LngLatBounds | undefined {
	let west = Infinity
	let south = Infinity
	let east = -Infinity
	let north = -Infinity

	let visit = (coordinate: Coordinate) => {
		let [lng, lat] = coordinate
		west = Math.min(west, lng)
		south = Math.min(south, lat)
		east = Math.max(east, lng)
		north = Math.max(north, lat)
	}

	for (let geometry of feature.geometry.geometries) {
		if (geometry.type === 'Point') {
			visit(geometry.coordinates)
		} else if (geometry.type === 'Polygon') {
			geometry.coordinates.forEach((ring) => ring.forEach(visit))
		} else if (geometry.type === 'MultiPolygon') {
			geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.forEach(visit)))
		}
	}

	if (!Number.isFinite(west) || !Number.isFinite(south)) {
		return undefined
	}

	return [west, south, east, north]
}
