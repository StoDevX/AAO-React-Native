import {normalizeLinks} from './normalize-link'
import type {AlsoHereTile, StackEntry} from './also-here'
import type {BuildingType} from '../../building-hours/types'
import type {Building} from '../types'

/// One tile in a card's carousels and their More grids. A tile that `opens` a
/// place stacks its card over this one; one with only an `href` opens the page.
export type PlaceTile = {
	kind: 'department' | 'office' | 'place' | 'accessible-parking'
	label: string
	href: string | null
	opens?: StackEntry
	/// The venue whose status the tile shows, if it has one.
	venue?: BuildingType
}

/// A building's departments then its offices, as tiles. The feed can omit
/// either field, and serves St. Olaf's as objects and Carleton's as strings.
export function placeTiles(building: Pick<Building, 'departments' | 'offices'>): Array<PlaceTile> {
	let tiles = (kind: PlaceTile['kind'], items: Building['departments'] | undefined) =>
		normalizeLinks(items).map(({label, href}) => ({kind, label, href: href || null}))
	return [...tiles('department', building.departments), ...tiles('office', building.offices)]
}

/// `alsoHere`'s tiles, as the carousels draw them.
export function toPlaceTiles(tiles: Array<AlsoHereTile>): Array<PlaceTile> {
	return tiles.map(({opens, label, group, venue}) => ({
		kind: group,
		label,
		href: null,
		opens,
		venue,
	}))
}
