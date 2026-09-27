import {ownHours} from '../../building-hours/lib'
import type {BuildingType} from '../../building-hours/types'
import type {Building, Feature} from '../types'

/// What a card opens when stacked over the map: a map feature, or a venue from
/// the Hours data that has no feature of its own.
/// `link`: the web page of a Departments or Offices tile merged with the
/// place, which its card lists among its links.
export type StackEntry =
	| {kind: 'feature'; id: string; link?: {label: string; href: string}}
	| {kind: 'venue'; name: string; link?: {label: string; href: string}}

/// One place at a location, before Departments and Offices take their share.
export type AlsoHereTile = {
	opens: StackEntry
	label: string
	group: 'place' | 'office'
	/// The venue whose status the tile shows, if it has one.
	venue: BuildingType | undefined
}

/**
 * What else is at a place, alphabetically: the points inside it, and the
 * Hours venues keyed to it other than its own, which its card already shows
 * as Hours. A venue keyed to one of those points comes through the point's
 * tile, since it is the point's own hours rather than the place's.
 */
export function alsoHere(
	feature: Feature<Building>,
	features: Array<Feature<Building>>,
	venues: Array<BuildingType>,
): Array<AlsoHereTile> {
	let points: Array<AlsoHereTile> = features
		.filter((point) => point.properties.parent === feature.id)
		.map((point) => ({
			opens: {kind: 'feature', id: point.id},
			label: point.properties.name,
			group: 'place',
			venue: ownHours(venues, point),
		}))

	let own = ownHours(venues, feature)
	let keyed: Array<AlsoHereTile> = venues
		.filter((venue) => venue.building === feature.id && venue !== own)
		.map((venue) => ({
			opens: {kind: 'venue', name: venue.name},
			label: venue.name,
			group: venue.kind === 'office' ? 'office' : 'place',
			venue,
		}))

	return [...points, ...keyed].sort((a, b) =>
		a.label.localeCompare(b.label, undefined, {sensitivity: 'base'}),
	)
}
