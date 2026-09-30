import type {Coordinate} from '../types'
import {nearestPoint} from './map-pins'

/// The place a tap on the map opens: the nearest drawn name of a place under
/// the touch, or else the building the touch landed in, or else nothing.
///
/// `features` is whatever the map has drawn around the touch. Only points
/// carrying a `buildingId` count -- a place's name, from whichever layer of
/// the style draws it -- so a building's own shape, which carries its id too,
/// never outranks a name drawn inside it.
export function placeForTap(
	features: GeoJSON.Feature[],
	touch: Coordinate,
	building: string | null,
): string | null {
	let named = features.filter((feature) => typeof feature.properties?.buildingId === 'string')
	let id: unknown = nearestPoint(named, touch)?.feature.properties?.buildingId
	return typeof id === 'string' ? id : building
}
