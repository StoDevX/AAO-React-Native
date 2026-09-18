import type {SFSymbol} from 'sf-symbols-typescript'
import {resolveGradient, type Gradient} from '@frogpond/colors'
import type {OrgCategoryMembership, OrgCategoryType, StudentOrgType} from './types'

/// Drawn for a category with no curated entry in data/org-categories.yaml
/// yet -- a new Presence.io category should never leave a tile with no
/// glyph at all while the data catches up.
export const FALLBACK_CATEGORY_ICON: SFSymbol = 'person.3.fill'

export type CategoryTileData = {
	name: string
	icon: SFSymbol
	gradient: Gradient
	count: number
}

/// Builds one tile per live category membership row -- no org list needed
/// here, which is the point: the landing screen can show tiles as soon as
/// the lightweight `/orgs/categories` route answers, without waiting on all
/// 225 full org records.
export function buildCategoryTiles(
	curated: OrgCategoryType[],
	memberships: OrgCategoryMembership[],
): CategoryTileData[] {
	let curatedByName = new Map(curated.map((entry) => [entry.name, entry]))

	return memberships.map((membership) => {
		let curatedEntry = curatedByName.get(membership.name)
		return {
			name: membership.name,
			icon: curatedEntry?.icon ?? FALLBACK_CATEGORY_ICON,
			gradient: resolveGradient(curatedEntry?.gradient),
			count: membership.organizationUris.length,
		}
	})
}

/// The org list and the membership list are matched by `organizationUri`
/// (Presence's stable slug), not by name or any string parsing -- `category`
/// on `StudentOrgType` is display text only now, not something to match on.
export function orgsInCategory(
	orgs: StudentOrgType[],
	membership: OrgCategoryMembership,
): StudentOrgType[] {
	let uris = new Set(membership.organizationUris)
	return orgs.filter((org) => uris.has(org.organizationUri))
}
