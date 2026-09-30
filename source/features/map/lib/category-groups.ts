import type {SFSymbol} from 'sf-symbols-typescript'
import {resolveGradient, type Gradient} from '@frogpond/colors'

import type {Campus} from '../../building-hours/types'
import type {MapGroupLabel} from '../../telemetry/catalog'
import type {Building, Feature} from '../types'

/// Drawn for an entry that names no icon, which a released app can meet in a
/// file written for a newer one.
export const FALLBACK_GROUP_ICON: SFSymbol = 'mappin'

/** One entry of data/map-categories.yaml. */
export type MapCategoryEntry = {
	label: string
	/** Raw `categories` values from the campus's map feed. */
	categories: string[]
	/** Optional here though the schema requires it; see `FALLBACK_GROUP_ICON`. */
	icon?: SFSymbol
	/** A name from `GRADIENT_NAMES`; anything else resolves to gray. */
	gradient?: string
}

/** data/map-categories.yaml, one list of groups per campus. */
export type MapCategoryTable = Record<Campus, MapCategoryEntry[]>

/** A group ready to draw as a tile. */
export type CategoryGroup = {
	label: MapGroupLabel
	categories: string[]
	icon: SFSymbol
	gradient: Gradient
}

function belongs(group: {categories: string[]}, place: Feature<Building>): boolean {
	let wanted = new Set(group.categories)
	return (place.properties.categories ?? []).some((category) => wanted.has(category))
}

/// The campus's groups that hold at least one place, in the file's order. An
/// entry can ship before the feed carries its values, and draws no tile
/// until it does.
export function groupsFor(
	table: MapCategoryTable,
	campus: Campus,
	places: Array<Feature<Building>>,
): CategoryGroup[] {
	return table[campus]
		.filter((entry) => places.some((place) => belongs(entry, place)))
		.map((entry) => ({
			// The one place a label becomes a MapGroupLabel: it came from the
			// published file, never from someone typing.
			label: entry.label as MapGroupLabel,
			categories: entry.categories,
			icon: entry.icon ?? FALLBACK_GROUP_ICON,
			gradient: resolveGradient(entry.gradient),
		}))
}

/// A group's places, sorted by name. A place matching two of the group's
/// values is still listed once.
export function placesIn(
	group: CategoryGroup,
	places: Array<Feature<Building>>,
): Array<Feature<Building>> {
	// `filter` returns a new array, so sorting it leaves the caller's alone.
	return places
		.filter((place) => belongs(group, place))
		.sort((a, b) => a.properties.name.localeCompare(b.properties.name))
}
