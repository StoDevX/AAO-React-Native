import {hasFootprint} from '../../map/lib/building-footprints'
import type {Building, Feature} from '../../map/types'
import type {BuildingType} from '../types'

/**
 * Finds the map feature a venue sits in, matching `venue.building` against
 * `Feature.id` and nothing else. A venue with no key, or a key that matches no
 * feature, returns `undefined` — that is the normal case for a whole campus
 * (Carleton carries no keys) and must not throw.
 *
 * Matching stays id-only on purpose: falling back to the building's name once
 * put the Skoglund Athletic Center in a car park named `lot-skoglund`, and
 * matched the Flaten Art Museum to the Flaten Art Barn, a different building.
 */
export function findBuildingFeature(
	features: Array<Feature<Building>>,
	venue: BuildingType,
): Feature<Building> | undefined {
	if (!venue.building) {
		return undefined
	}

	return features.find((feature) => feature.id === venue.building)
}

/**
 * The feature a venue's cutout should frame: its own, or the nearest thing it
 * sits inside that has an outline to draw.
 *
 * Six St. Olaf venues key to a point rather than a footprint -- the dining
 * rooms, the bookstore, the visitor desk, the admissions office -- because the
 * college publishes them in the points-of-interest layer. A point has no area,
 * so framing one gave a bounding box of zero size and a blank tile at maximum
 * zoom. Those records carry a `parent` naming the building they are in, which
 * is what this follows.
 *
 * Returns `undefined` when nothing in the chain has an outline, which is the
 * answer for the windmill and the wind chime memorial: they are in no building
 * and there is nothing to draw.
 */
export function resolveCutoutFeature(
	features: Array<Feature<Building>>,
	venue: BuildingType,
): Feature<Building> | undefined {
	let feature = findBuildingFeature(features, venue)

	// A `parent` that names its own place, or two that name each other, would
	// walk forever. verify.py in campus-map-data rejects both, but this reads
	// whatever the server sends and a hung render is worse than no cutout.
	let visited = new Set<string>()

	while (feature) {
		if (hasFootprint(feature)) {
			return feature
		}

		let parent = feature.properties.parent
		if (!parent || visited.has(feature.id)) {
			return undefined
		}
		visited.add(feature.id)

		feature = features.find((candidate) => candidate.id === parent)
	}

	return undefined
}
