import type {SFSymbol} from 'sf-symbols-typescript'
import {resolveGradient, type Gradient} from '@frogpond/colors'

import type {CampusId} from '../../../campuses/ids'
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

/** One entry of a campus's `icons` list: the icon a place gets when it
 * carries any of `categories`, unless an earlier entry claimed it. */
export type MapIconEntry = {
	categories: string[]
	icon?: SFSymbol
	gradient?: string
}

/** One campus's entry in data/map-categories.yaml: its tiles and its places' icons. */
export type CampusMapCategories = {groups: MapCategoryEntry[]; icons: MapIconEntry[]}

/** data/map-categories.yaml, by campus id. A campus the file leaves out has no groups. */
export type MapCategoryTable = Partial<Record<CampusId, CampusMapCategories>>

/** A group ready to draw as a tile. */
export type CategoryGroup = {
	label: MapGroupLabel
	categories: string[]
	icon: SFSymbol
	gradient: Gradient
}

/// Whether a place carries any of a group's values. The set is built once per
/// group, not once per place tested.
function belongsTo(group: {categories: string[]}): (place: Feature<Building>) => boolean {
	let wanted = new Set(group.categories)
	return (place) => (place.properties.categories ?? []).some((category) => wanted.has(category))
}

/// The campus's groups that hold at least one place, in the file's order. An
/// entry can ship before the feed carries its values, and draws no tile
/// until it does.
export function groupsFor(
	table: MapCategoryTable,
	campus: CampusId,
	places: Array<Feature<Building>>,
): CategoryGroup[] {
	// A label is how a group is keyed and found again, so the first entry
	// with a label wins and any later one sharing it is dropped.
	let seen = new Set<string>()
	return (table[campus]?.groups ?? [])
		.filter((entry) => {
			if (seen.has(entry.label)) {
				return false
			}
			seen.add(entry.label)
			return true
		})
		.filter((entry) => places.some(belongsTo(entry)))
		.map((entry) => ({
			// The one place a label becomes a MapGroupLabel: it came from the
			// published file, never from someone typing.
			label: entry.label as MapGroupLabel,
			categories: entry.categories,
			icon: entry.icon ?? FALLBACK_GROUP_ICON,
			gradient: resolveGradient(entry.gradient),
		}))
}

/** What a place's row draws beside its name. */
export type PlaceIcon = {icon: SFSymbol; gradient: Gradient}

/// The icon of the first entry sharing any of `categories`: the lists run
/// most specific first, so a pond draws a drop rather than the tree every
/// outdoor place shares. A place no entry names draws a gray pin.
export function placeIcon(categories: string[] | undefined, entries: MapIconEntry[]): PlaceIcon {
	let own = new Set(categories)
	let entry = entries.find((candidate) => candidate.categories.some((c) => own.has(c)))
	return {
		icon: entry?.icon ?? FALLBACK_GROUP_ICON,
		gradient: resolveGradient(entry?.gradient),
	}
}

/// A group's color as `rgb(r, g, b)`: its gradient's darker stop,
/// `color(display-p3 r g b)`, read as sRGB. Neither a SwiftUI image's color
/// nor MapLibre's paint takes display-p3, so this comes out a little less
/// saturated than the gradient itself.
export function groupColor(gradient: Gradient): string {
	let channels = gradient[1].match(/[\d.]+/gu)?.slice(-3) ?? ['0', '0', '0']
	let [r, g, b] = channels.map((channel) => Math.round(Number(channel) * 255))
	return `rgb(${r}, ${g}, ${b})`
}

/// A group's places, sorted by name. A place matching two of the group's
/// values is still listed once.
export function placesIn(
	group: CategoryGroup,
	places: Array<Feature<Building>>,
): Array<Feature<Building>> {
	return byName(places.filter(belongsTo(group)))
}

/// Places sorted by name, as a new array; the caller's is left alone.
export function byName(places: Array<Feature<Building>>): Array<Feature<Building>> {
	return [...places].sort((a, b) => a.properties.name.localeCompare(b.properties.name))
}
