import type {LngLatBounds} from '@maplibre/maplibre-react-native'

import type {Building, Coordinate, Feature, Point} from '../types'
import {featureBounds} from './feature-bounds'
import {distanceSquared} from './distance'
import {anchorOf} from './place-geometry'

/// Search results' pins: iOS system red in its light appearance, as a string
/// MapLibre's paint accepts. A `PlatformColor` is not one.
export const SEARCH_PIN_COLOR = 'rgb(255, 59, 48)'

/** What the sheet is listing, for the map to pin. */
export type MapPins = {
	places: Array<Feature<Building>>
	/** A MapLibre paint color. */
	color: string
	/** Changes only when the camera should frame these pins. */
	frameKey: number
}

export type PinProperties = {buildingId: string; name: string}

/// One GeoJSON point per place, at the place's own point. A place with none
/// is listed in the sheet but has nowhere to go on the map.
export function pinCollection(
	places: Array<Feature<Building>>,
): GeoJSON.FeatureCollection<GeoJSON.Point, PinProperties> {
	return {
		type: 'FeatureCollection',
		features: places.flatMap((place) => {
			let point = anchorOf(place)
			if (!point) {
				return []
			}
			return [
				{
					type: 'Feature' as const,
					geometry: {type: 'Point' as const, coordinates: point.coordinates},
					properties: {buildingId: place.id, name: place.properties.name},
				},
			]
		}),
	}
}

function pointsOf(places: Array<Feature<Building>>): Point[] {
	return places.flatMap((place) => {
		let point = anchorOf(place)
		return point ? [point] : []
	})
}

/// The box around the pins, or nothing for fewer than two: a zero-area box
/// clamps MapLibre to its maximum zoom.
export function pinBounds(places: Array<Feature<Building>>): LngLatBounds | undefined {
	let points = pointsOf(places)
	if (points.length < 2) {
		return undefined
	}
	return featureBounds({
		type: 'Feature',
		id: 'pins',
		geometry: {type: 'GeometryCollection', geometries: points},
		properties: places[0].properties,
	})
}

export type PinPress =
	| {kind: 'pin'; buildingId: string}
	| {kind: 'cluster'; clusterId: number; center: Coordinate}
	| null

/// The point feature nearest a touch, and where it is. A touch's hitbox can
/// cover more than one, and MapLibre lists them in no useful order.
export function nearestPoint(
	features: GeoJSON.Feature[],
	touch: Coordinate,
): {feature: GeoJSON.Feature; at: Coordinate} | undefined {
	let nearest: {feature: GeoJSON.Feature; at: Coordinate} | undefined
	for (let feature of features) {
		if (feature.geometry.type !== 'Point') {
			continue
		}
		let [lng, lat] = feature.geometry.coordinates
		let at: Coordinate = [lng, lat]
		if (!nearest || distanceSquared(at, touch) < distanceSquared(nearest.at, touch)) {
			nearest = {feature, at}
		}
	}
	return nearest
}

/// What a press on the pins' source hit: a place's pin, a cluster of them, or
/// neither -- the one nearest the touch.
export function pressedPin(features: GeoJSON.Feature[], touch: Coordinate): PinPress {
	let nearest = nearestPoint(features, touch)
	if (!nearest) {
		return null
	}
	let properties = nearest.feature.properties ?? {}
	let [lng, lat] = nearest.at
	if (properties.cluster === true && typeof properties.cluster_id === 'number') {
		return {kind: 'cluster', clusterId: properties.cluster_id, center: [lng, lat]}
	}
	if (typeof properties.buildingId === 'string') {
		return {kind: 'pin', buildingId: properties.buildingId}
	}
	return null
}

/// The places a set of pin features stand for, such as a cluster's leaves.
export function pinIds(features: GeoJSON.Feature[]): string[] {
	return features.flatMap((feature) => {
		let id: unknown = feature.properties?.buildingId
		return typeof id === 'string' ? [id] : []
	})
}

export type Framing =
	| {kind: 'fit'; bounds: LngLatBounds}
	| {kind: 'ease'; center: Coordinate}
	| null

/// How the camera frames a set of pins: fit several, ease to one, leave the
/// camera alone for none.
export function framingFor(places: Array<Feature<Building>>): Framing {
	let bounds = pinBounds(places)
	if (bounds) {
		return {kind: 'fit', bounds}
	}
	let [only] = pointsOf(places)
	return only ? {kind: 'ease', center: only.coordinates} : null
}
