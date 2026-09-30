import type {Building, Coordinate, Feature, Point} from '../types'
import {featureBounds} from './feature-bounds'
import type {Framing} from './map-pins'

/// What the map draws for the open place.
export type Selection = {
	name: string
	/// Where the name sits: the place's label anchor.
	at: Coordinate
	/// A trail's course, drawn in place of the dot; null for any other place.
	lines: Array<Array<Coordinate>> | null
}

function anchorOf(place: Feature<Building>): Point | undefined {
	return place.geometry.geometries.find((geo): geo is Point => geo.type === 'Point')
}

function linesOf(place: Feature<Building>): Array<Array<Coordinate>> {
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

/// A trail is drawn as its line, anything else as a dot; both carry the name
/// at the anchor. Nothing is drawn for a place with no anchor.
export function selectionFor(place: Feature<Building>): Selection | null {
	let anchor = anchorOf(place)
	if (!anchor) {
		return null
	}
	let lines = linesOf(place)
	return {
		name: place.properties.name,
		at: anchor.coordinates,
		lines: lines.length > 0 ? lines : null,
	}
}

/// A trail is framed whole, since its anchor is one vertex of a long course;
/// anything else is eased to at the selection zoom, as it always was.
export function selectionFraming(place: Feature<Building>): Framing {
	let anchor = anchorOf(place)
	if (!anchor) {
		return null
	}
	if (linesOf(place).length > 0) {
		let bounds = featureBounds(place)
		if (bounds) {
			return {kind: 'fit', bounds}
		}
	}
	return {kind: 'ease', center: anchor.coordinates}
}
