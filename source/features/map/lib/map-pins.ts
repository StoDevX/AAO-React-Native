import type {LngLatBounds} from '@maplibre/maplibre-react-native'
import type {Gradient} from '@frogpond/colors'

import type {Building, Coordinate, Feature, Point} from '../types'
import {featureBounds} from './feature-bounds'

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

function pointOf(place: Feature<Building>): Point | undefined {
	return place.geometry.geometries.find((geometry): geometry is Point => geometry.type === 'Point')
}

/// One GeoJSON point per place, at the place's own point. A place with none
/// is listed in the sheet but has nowhere to go on the map.
export function pinCollection(
	places: Array<Feature<Building>>,
): GeoJSON.FeatureCollection<GeoJSON.Point, PinProperties> {
	return {
		type: 'FeatureCollection',
		features: places.flatMap((place) => {
			let point = pointOf(place)
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
		let point = pointOf(place)
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

/// A group's pin color: its gradient's darker stop, `color(display-p3 r g b)`,
/// read as sRGB. MapLibre's paint has no display-p3, so pins come out a
/// little less saturated than the tiles drawn from the same gradient.
export function pinColor(gradient: Gradient): string {
	let channels = gradient[1].match(/[\d.]+/gu)?.slice(-3) ?? ['0', '0', '0']
	let [r, g, b] = channels.map((channel) => Math.round(Number(channel) * 255))
	return `rgb(${r}, ${g}, ${b})`
}

export type PinPress =
	| {kind: 'pin'; buildingId: string}
	| {kind: 'cluster'; clusterId: number; center: Coordinate}
	| null

/// What a press on the pins' source hit: a place's pin, a cluster of them, or
/// neither.
export function pressedPin(features: GeoJSON.Feature[]): PinPress {
	let feature = features[0]
	if (feature?.geometry.type !== 'Point') {
		return null
	}
	let properties = feature.properties ?? {}
	let [lng, lat] = feature.geometry.coordinates
	if (properties.cluster === true && typeof properties.cluster_id === 'number') {
		return {kind: 'cluster', clusterId: properties.cluster_id, center: [lng, lat]}
	}
	if (typeof properties.buildingId === 'string') {
		return {kind: 'pin', buildingId: properties.buildingId}
	}
	return null
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
