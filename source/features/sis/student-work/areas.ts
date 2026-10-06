import {grayGradient, resolveGradient, type Gradient} from '@frogpond/colors'
import type {SFSymbol} from 'sf-symbols-typescript'
import type {UnitsAvailability} from './units'

/// An area as data/student-work-areas.yaml writes it.
export type AreaEntry = {
	name: string
	slug: string
	icon: string
	gradient: unknown
	units: string[]
}

/// One Student Work tile: a group of St. Olaf units, from data/student-work-areas.yaml.
export type StudentWorkArea = {
	name: string
	slug: string
	icon: SFSymbol
	gradient: Gradient
	units: string[]
}

export function toAreas(entries: AreaEntry[]): StudentWorkArea[] {
	return entries.map((entry) => ({
		...entry,
		// The schema checks only that this is a string; see org-categories.yaml.
		icon: entry.icon as SFSymbol,
		gradient: resolveGradient(entry.gradient),
	}))
}

/// Postings whose Unit Number the server could not read. Not in
/// data/student-work-areas.yaml: no edit there can place them.
export const UNKNOWN_AREA: StudentWorkArea = {
	name: 'Unknown',
	slug: 'unknown',
	icon: 'questionmark.circle.fill' as SFSymbol,
	gradient: grayGradient,
	units: [],
}

/// The published areas followed by Unknown; none until the areas load.
export function withUnknownArea(areas: StudentWorkArea[]): StudentWorkArea[] {
	return areas.length === 0 ? areas : [...areas, UNKNOWN_AREA]
}

export type AreaStatus = {
	/// The board's postings in this area.
	ids: Set<string>
	count: number
	/// Holds nothing, so its tile is dimmed.
	empty: boolean
}

/// Which of the board's postings each area holds, keyed by the area's slug. A
/// posting belongs to every area that lists its unit. One whose unit is null,
/// with no parsable unit number, belongs to Unknown; one not known yet, to none.
export function areaMembership(
	areas: StudentWorkArea[],
	unitsById: Map<string, string | null>,
	boardIds: Set<string>,
): Map<string, AreaStatus> {
	let statuses = new Map<string, AreaStatus>()

	for (let area of areas) {
		let units = new Set(area.units)
		let ids = new Set<string>()
		for (let id of boardIds) {
			let unit = unitsById.get(id)
			if (unit === undefined) continue
			if (unit === null ? area.slug === UNKNOWN_AREA.slug : units.has(unit)) ids.add(id)
		}
		statuses.set(area.slug, {ids, count: ids.size, empty: ids.size === 0})
	}

	return statuses
}

/// Whether a list with these areas chosen (by slug) can show its postings.
/// With none chosen it always can; with some, it waits on the units, since
/// until they load it cannot tell the areas' postings from the rest.
export function chosenAreaState(
	chosenSlugs: string[] | null,
	availability: UnitsAvailability,
): UnitsAvailability {
	if (chosenSlugs === null || chosenSlugs.length === 0) return 'ready'
	return availability
}
