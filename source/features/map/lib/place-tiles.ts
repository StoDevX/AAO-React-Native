import {normalizeLinks} from './normalize-link'
import type {AlsoHereTile, StackEntry} from './also-here'
import type {BuildingType} from '../../building-hours/types'
import type {Building} from '../types'

/// One tile in a card's carousels and their More grids. A tile that `opens` a
/// place stacks its card over this one; one with only an `href` opens the page.
export type PlaceTile = {
	kind: 'department' | 'office' | 'place'
	label: string
	href: string | null
	opens?: StackEntry
	/// The venue whose status the tile shows, if it has one.
	venue?: BuildingType
}

/// How many tiles the carousel shows before More takes over.
export const CAROUSEL_TILE_LIMIT = 6

/// A building's departments then its offices, as tiles. The feed can omit
/// either field, and serves St. Olaf's as objects and Carleton's as strings.
export function placeTiles(building: Pick<Building, 'departments' | 'offices'>): Array<PlaceTile> {
	let tiles = (kind: PlaceTile['kind'], items: Building['departments'] | undefined) =>
		normalizeLinks(items).map(({label, href}) => ({kind, label, href: href || null}))
	return [...tiles('department', building.departments), ...tiles('office', building.offices)]
}

/**
 * The tiles a carousel shows, and those its More tile stands for. A More tile
 * takes the place of one tile, so it only earns that place when it hides at
 * least two: seven tiles show all seven.
 */
export function splitCarousel<T>(tiles: Array<T>): {shown: Array<T>; hidden: Array<T>} {
	if (tiles.length <= CAROUSEL_TILE_LIMIT + 1) {
		return {shown: tiles, hidden: []}
	}
	return {shown: tiles.slice(0, CAROUSEL_TILE_LIMIT), hidden: tiles.slice(CAROUSEL_TILE_LIMIT)}
}

/// `alsoHere`'s tiles, as the carousels draw them.
export function toPlaceTiles(tiles: Array<AlsoHereTile>): Array<PlaceTile> {
	return tiles.map(({opens, label, group, venue}) => ({
		kind: group === 'office' ? 'office' : 'place',
		label,
		href: null,
		opens,
		venue,
	}))
}
