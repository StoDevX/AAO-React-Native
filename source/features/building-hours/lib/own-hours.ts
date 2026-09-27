import type {Building, Feature} from '../../map/types'
import type {BuildingType} from '../types'

/**
 * The venue whose hours are this map feature's own, which is what its card
 * shows, or `undefined` when it has none of its own.
 *
 * A building shows only its `kind: building` venue: Tomson Hall's card shows
 * Tomson Hall's hours, not the Registrar's inside it, and Tom Porter Hall,
 * whose only venue is its weight room, shows nothing rather than passing the
 * room's hours off as the building's.
 *
 * A point inside a building (a feature with a `parent`, as The Cage and Stav
 * Hall are) is its one venue, whatever that venue's kind, so it shows it. A
 * point with several venues, like the Lion's Pause, shows none: which one is
 * "the Pause" is not a question the data answers.
 *
 * Matching is by `building` key only, never by name; see
 * `findBuildingFeature`. validate-building-keys forbids two `building`
 * venues on one key; should two slip through, the first is taken.
 */
export function ownHours(
	venues: Array<BuildingType>,
	feature: Feature<Building>,
): BuildingType | undefined {
	let keyed = venues.filter((venue) => venue.building === feature.id)
	let building = keyed.find((venue) => venue.kind === 'building')
	if (building) {
		return building
	}
	if (feature.properties.parent && keyed.length === 1) {
		return keyed[0]
	}
	return undefined
}
