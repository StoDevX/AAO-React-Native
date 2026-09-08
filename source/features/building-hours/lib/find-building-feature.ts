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
