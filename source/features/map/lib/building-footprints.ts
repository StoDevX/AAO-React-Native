import type {Building, Feature, Ring} from '../types'

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
 * building arrives as a GeometryCollection holding a Polygon (or, for a
 * handful of St. Olaf buildings such as the field house and the townhouses, a
 * MultiPolygon) and a Point, and MapLibre does not render GeometryCollection
 * at all -- it is valid GeoJSON that the style spec simply does not cover.
 * And a building with wings arrives as several ring sets -- either several
 * Polygons or one MultiPolygon's own coordinate array -- which have to become
 * one MultiPolygon feature rather than several, so that a tap resolves to one
 * building and the whole outline highlights together.
 *
 * The id is carried in `properties` as well as on the feature: the press event
 * hands back properties, and relying on the top-level id would mean trusting
 * MapLibre to round-trip a string id through the native layer.
 */
export function toBuildingFootprints(
	buildings: Array<Feature<Building>>,
): BuildingFootprintCollection {
	let features = buildings.flatMap((building) => {
		// A Polygon contributes one ring set; a MultiPolygon's coordinates are
		// already an array of ring sets, one per disjoint wing, so it spreads in
		// rather than nesting another level.
		let ringSets = building.geometry.geometries.flatMap((geo) => {
			if (geo.type === 'Polygon') {
				return [geo.coordinates]
			}
			if (geo.type === 'MultiPolygon') {
				return geo.coordinates
			}
			return []
		})

		// Points-only features -- a few outdoor spaces are filed that way -- have
		// no footprint to draw. They stay searchable; they just aren't tappable
		// on the map, which was already true.
		if (ringSets.length === 0) {
			return []
		}

		return [
			{
				type: 'Feature' as const,
				id: building.id,
				geometry: {
					type: 'MultiPolygon' as const,
					coordinates: ringSets,
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

/**
 * Whether a feature has an outline a map can draw.
 *
 * Several St. Olaf venues key to a point-of-interest record whose only geometry
 * is a Point -- Buntrock's dining rooms, the bookstore, admissions. There is
 * nothing to fill, outline or label, so anything that would frame or highlight
 * a building has to ask this first rather than discovering it halfway down.
 */
export function hasFootprint(building: Feature<Building>): boolean {
	return toBuildingFootprints([building]).features.length > 0
}
