import type {Building, Coordinate, Feature, Point} from '../types'

/// A place's own point: its label anchor, where its pin and dot go.
export function anchorOf(place: Feature<Building>): Point | undefined {
	return place.geometry.geometries.find((geo): geo is Point => geo.type === 'Point')
}

/// A trail's course, every part of it; empty for any other place.
export function linesOf(place: Feature<Building>): Array<Array<Coordinate>> {
	return place.geometry.geometries.flatMap((geo) => {
		if (geo.type === 'LineString') {
			return [geo.coordinates]
		}
		if (geo.type === 'MultiLineString') {
			return geo.coordinates
		}
		return []
	})
}
