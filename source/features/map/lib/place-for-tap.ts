import type {Coordinate} from '../types'
import {distanceSquared, segmentDistanceSquared} from './distance'

/// How far a touch is from a drawn feature, squared: to a point, or to the
/// nearest stretch of a line. A polygon has no distance -- a building's own
/// shape carries its id too, and must never outrank a name drawn inside it.
function reach(feature: GeoJSON.Feature, touch: Coordinate): number | undefined {
	let geometry = feature.geometry
	if (geometry.type === 'Point') {
		let [lng, lat] = geometry.coordinates
		return distanceSquared([lng, lat], touch)
	}
	let lines =
		geometry.type === 'LineString'
			? [geometry.coordinates]
			: geometry.type === 'MultiLineString'
				? geometry.coordinates
				: []
	let nearest: number | undefined
	for (let line of lines) {
		for (let i = 1; i < line.length; i++) {
			let d = segmentDistanceSquared(line[i - 1], line[i], touch)
			nearest = nearest === undefined ? d : Math.min(nearest, d)
		}
	}
	return nearest
}

function isLine(feature: GeoJSON.Feature): boolean {
	return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
}

function isName(feature: GeoJSON.Feature): boolean {
	return feature.geometry.type === 'Point' && typeof feature.properties?.buildingId === 'string'
}

/// What a tap weighs: the names drawn within a finger's reach of the touch,
/// and the trails drawn under it. A line counts only from the close reach,
/// since trail loops hug the ponds and fields they circle -- from the wide one,
/// a tap in the water would open the loop around it.
///
/// A name drawn under the touch itself settles it. A name is measured by its
/// anchor but drawn as a box of text around it, so a touch on the far end of
/// the text can be nearer a trail than the anchor, and the text is still what
/// was tapped.
export function tapCandidates(
	near: GeoJSON.Feature[],
	close: GeoJSON.Feature[],
	under: GeoJSON.Feature[] = [],
): GeoJSON.Feature[] {
	let tapped = under.filter(isName)
	if (tapped.length > 0) {
		return tapped
	}
	return [...near.filter((feature) => !isLine(feature)), ...close.filter(isLine)]
}

/// The place a tap on the map opens: the drawn name or trail nearest the
/// touch, or else the building the touch landed in, or else nothing.
///
/// `features` is what the map has drawn at the touch, as `tapCandidates`
/// gathers it. Only features carrying a `buildingId` count -- a place's name,
/// or a trail's line, from whichever layer of the style draws it.
export function placeForTap(
	features: GeoJSON.Feature[],
	touch: Coordinate,
	building: string | null,
): string | null {
	let best: {id: string; distance: number} | undefined
	for (let feature of features) {
		let id: unknown = feature.properties?.buildingId
		if (typeof id !== 'string') {
			continue
		}
		let distance = reach(feature, touch)
		if (distance !== undefined && (!best || distance < best.distance)) {
			best = {id, distance}
		}
	}
	return best?.id ?? building
}
