import {normalizeLinks} from './normalize-link'
import type {Building} from '../types'

/// One tile in the card's Departments & Offices carousel and its More grid.
export type PlaceTile = {kind: 'department' | 'office'; label: string; href: string | null}

/// How many tiles the carousel shows before More takes over.
export const CAROUSEL_TILE_LIMIT = 6

/// A building's departments then its offices, as tiles. The feed can omit
/// either field, and serves St. Olaf's as objects and Carleton's as strings.
export function placeTiles(building: Pick<Building, 'departments' | 'offices'>): Array<PlaceTile> {
	let tiles = (kind: PlaceTile['kind'], items: Building['departments'] | undefined) =>
		normalizeLinks(items).map(({label, href}) => ({kind, label, href: href || null}))
	return [...tiles('department', building.departments), ...tiles('office', building.offices)]
}
