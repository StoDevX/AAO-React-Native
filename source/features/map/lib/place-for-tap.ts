import type {Coordinate} from '../types'
import {distanceSquared} from './map-pins'

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

/// The squared distance from `p` to the segment `a`-`b`, measured the way
/// `distanceSquared` measures: longitude shrunk by the latitude's cosine.
function segmentDistanceSquared(a: GeoJSON.Position, b: GeoJSON.Position, p: Coordinate): number {
	let shrink = Math.cos((p[1] * Math.PI) / 180)
	let [ax, ay] = [a[0] * shrink, a[1]]
	let [bx, by] = [b[0] * shrink, b[1]]
	let [px, py] = [p[0] * shrink, p[1]]
	let [dx, dy] = [bx - ax, by - ay]
	let length = dx * dx + dy * dy
	let t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
	return (ax + t * dx - px) ** 2 + (ay + t * dy - py) ** 2
}

function isLine(feature: GeoJSON.Feature): boolean {
	return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString'
}

/// What a tap weighs: the names drawn within a finger's reach of the touch,
/// and the trails drawn under it. A line counts only from the close reach,
/// since trail loops hug the ponds and fields they circle -- from the wide one,
/// a tap in the water would open the loop around it.
export function tapCandidates(
	near: GeoJSON.Feature[],
	close: GeoJSON.Feature[],
): GeoJSON.Feature[] {
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
