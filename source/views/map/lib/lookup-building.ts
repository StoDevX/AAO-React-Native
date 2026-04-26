import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type {Building, Coordinate, Feature, Polygon} from '../types'

export function lookupBuildingByCoordinates(
	[lng, lat]: Coordinate,
	features: Array<Feature<Building>>,
): Feature<Building> | undefined {
	let searchPoint = {
		type: 'Feature' as const,
		properties: {},
		geometry: {type: 'Point' as const, coordinates: [lng, lat] as [number, number]},
	}

	return features.find((feature) => {
		let polygon = feature.geometry.geometries.find(
			(geo): geo is Polygon => geo.type === 'Polygon',
		)
		if (!polygon) {
			return false
		}
		return booleanPointInPolygon(searchPoint, {
			type: 'Feature',
			properties: {},
			geometry: polygon,
		})
	})
}
