import type {Building, Feature, Polygon, Ring} from '../types'

export type BuildingFootprint = {
	type: 'Feature'
	id: string
	geometry: {type: 'MultiPolygon'; coordinates: Array<Array<Ring>>}
	properties: {buildingId: string; name: string}
}

export type BuildingFootprintCollection = {
	type: 'FeatureCollection'
	features: Array<BuildingFootprint>
}

/**
 * Flattens the campus features into something MapLibre will draw.
 *
 * Two things stand between the server's shape and a renderable one. Each
 * building arrives as a GeometryCollection holding a Polygon and a Point, and
 * MapLibre does not render GeometryCollection at all -- it is valid GeoJSON
 * that the style spec simply does not cover. And a building with wings arrives
 * as several Polygons, which have to become one MultiPolygon rather than
 * several features, so that a tap resolves to one building and the whole
 * outline highlights together.
 *
 * The id is carried in `properties` as well as on the feature: the press event
 * hands back properties, and relying on the top-level id would mean trusting
 * MapLibre to round-trip a string id through the native layer.
 */
export function toBuildingFootprints(
	buildings: Array<Feature<Building>>,
): BuildingFootprintCollection {
	let features = buildings.flatMap((building) => {
		let polygons = building.geometry.geometries.filter(
			(geo): geo is Polygon => geo.type === 'Polygon',
		)

		// Points-only features -- a few outdoor spaces are filed that way -- have
		// no footprint to draw. They stay searchable; they just aren't tappable
		// on the map, which was already true.
		if (polygons.length === 0) {
			return []
		}

		return [
			{
				type: 'Feature' as const,
				id: building.id,
				geometry: {
					type: 'MultiPolygon' as const,
					coordinates: polygons.map((polygon) => polygon.coordinates),
				},
				properties: {
					buildingId: building.id,
					name: building.properties.name,
				},
			},
		]
	})

	return {type: 'FeatureCollection', features}
}
