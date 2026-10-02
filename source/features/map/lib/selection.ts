import type {Building, Coordinate, Feature} from '../types'
import {featureBounds} from './feature-bounds'
import type {Framing} from './map-pins'
import {anchorOf, linesOf} from './place-geometry'

/// What the map draws for the open place.
export type Selection = {
	name: string
	/// The place's point: where a dot goes. A trail's name follows its line.
	at: Coordinate
	/// A trail's course, drawn in place of the dot; null for any other place.
	lines: Array<Array<Coordinate>> | null
}

/// A trail is drawn as its line, named along it, and anything else as a dot
/// named under it. A trail with no anchor is pinned at its first part's middle
/// vertex, which is where campus-map-data would have put the anchor. Nothing
/// is drawn for any other place with no anchor.
export function selectionFor(place: Feature<Building>): Selection | null {
	let lines = linesOf(place)
	let first = lines[0]
	let at = anchorOf(place)?.coordinates ?? first?.[Math.floor(first.length / 2)]
	if (!at) {
		return null
	}
	return {name: place.properties.name, at, lines: lines.length > 0 ? lines : null}
}

/// A trail is framed whole, since any one point of it is only a vertex of a
/// long course; anything else is eased to at the selection zoom.
export function selectionFraming(place: Feature<Building>): Framing {
	if (linesOf(place).length > 0) {
		let bounds = featureBounds(place)
		if (bounds) {
			return {kind: 'fit', bounds}
		}
	}
	let anchor = anchorOf(place)
	return anchor ? {kind: 'ease', center: anchor.coordinates} : null
}
