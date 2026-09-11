import type {SFSymbol} from 'sf-symbols-typescript'
import {resolveGradient, type Gradient} from '@frogpond/colors'
import type {OrgCategoryType, StudentOrgType} from './types'

/// Drawn for a category with no curated entry in data/org-categories.yaml
/// yet -- a new Presence.io category should never leave a tile with no
/// glyph at all while the data catches up.
export const FALLBACK_CATEGORY_ICON: SFSymbol = 'person.3.fill'

/// `org.category` is one Presence.io field holding a comma-separated list
/// (e.g. "Special Interest, Performance"), not an enum -- this is the one
/// place that splits it back into distinct category names.
export function categoriesFor(org: StudentOrgType): string[] {
	return org.category
		.split(',')
		.map((category) => category.trim())
		.filter((category) => category.length > 0)
}

/// An org with more than one category is grouped under every one of them,
/// so it stays reachable from any tile Presence.io tagged it with.
export function groupOrgsByCategory(orgs: StudentOrgType[]): Map<string, StudentOrgType[]> {
	let groups = new Map<string, StudentOrgType[]>()

	for (let org of orgs) {
		for (let category of categoriesFor(org)) {
			let existing = groups.get(category)
			if (existing) {
				existing.push(org)
			} else {
				groups.set(category, [org])
			}
		}
	}

	return groups
}

export type CategoryTileData = {
	name: string
	icon: SFSymbol
	gradient: Gradient
	count: number
}

/// Merges the curated icon/gradient list with whatever categories the live
/// org data actually has. A category curated but currently empty is
/// dropped rather than shown as a dead end; a category present in the data
/// but not yet curated still gets a tile, just with the fallback look.
export function buildCategoryTiles(
	curated: OrgCategoryType[],
	orgs: StudentOrgType[],
): CategoryTileData[] {
	let curatedByName = new Map(curated.map((entry) => [entry.name, entry]))
	let grouped = groupOrgsByCategory(orgs)

	return [...grouped.entries()].map(([name, orgsInCategory]) => {
		let curatedEntry = curatedByName.get(name)
		return {
			name,
			icon: curatedEntry?.icon ?? FALLBACK_CATEGORY_ICON,
			gradient: resolveGradient(curatedEntry?.gradient),
			count: orgsInCategory.length,
		}
	})
}
