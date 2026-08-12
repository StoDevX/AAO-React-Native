import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type {Building, Coordinate, Feature, Polygon} from '../types'

export function lookupBuildingByCoordinates(
	[lng, lat]: Coordinate,
	features: Array<Feature<Building>>,
): Feature<Building> | undefined {
	let searchPoint = {
		type: 'Feature' as const,
		properties: {},
		geometry: {
			type: 'Point' as const,
			coordinates: [lng, lat] as [number, number],
		},
	}

	// Every polygon, not just the first: a building with wings is stored as
	// several polygons in one GeometryCollection, and stopping at the first
	// would leave every wing but one untappable.
	return features.find((feature) =>
		feature.geometry.geometries
			.filter((geo): geo is Polygon => geo.type === 'Polygon')
			.some((polygon) =>
				booleanPointInPolygon(searchPoint, {
					type: 'Feature',
					properties: {},
					geometry: polygon,
				}),
			),
	)
}
