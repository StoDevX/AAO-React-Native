import {HomeViews} from '../views'
import type {ViewType} from '../views'
import type {Campus} from '../campus/store'

/** A screen a Home Screen quick action can open. */
export type QuickActionDestination = {
	/** What the store saves. The tile's title, which the home grid keys tiles by too. */
	id: string
	title: string
	icon: ViewType['icon']
	/** The Expo Router path a tap opens. */
	href: string
}

/** iOS shows at most four quick actions. */
export const MAX_QUICK_ACTIONS = 4

export const DEFAULT_QUICK_ACTIONS: string[] = [
	'Stav Menu',
	'Cage Menu',
	'Olaf Messenger',
	'Transit',
]

/** A Carleton install's starting picks: the CARLS tiles reached most. */
export const DEFAULT_CARLETON_QUICK_ACTIONS: string[] = ['Menus', 'Building Hours', 'SUMO', 'Convo']

/** The starting picks for `campus`. */
export function defaultQuickActions(campus: Campus): string[] {
	return campus === 'carleton' ? DEFAULT_CARLETON_QUICK_ACTIONS : DEFAULT_QUICK_ACTIONS
}

/** Cafés get an action each, though the home grid has one Menus tile for all of them. */
const CAFE_MENUS: QuickActionDestination[] = [
	{id: 'Stav Menu', title: 'Stav Menu', icon: 'fork.knife', href: '/menus'},
	{id: 'Cage Menu', title: 'Cage Menu', icon: 'cup.and.saucer.fill', href: '/menus/the-cage'},
]

/**
 * Every screen the quick-action picker offers on `campus`: St. Olaf's café
 * menus, then each of the campus's home tiles that opens a screen in the app.
 * St. Olaf's bare Menus tile is left out, since it opens the same screen as
 * Stav Menu.
 */
export function quickActionDestinations(campus: Campus = 'stolaf'): QuickActionDestination[] {
	let tiles = HomeViews(campus).flatMap((view): QuickActionDestination[] => {
		if (view.type !== 'view' || view.disabled || view.devOnly) {
			return []
		}
		if (typeof view.view !== 'string' || view.view === '/menus') {
			return []
		}
		return [{id: view.title, title: view.title, icon: view.icon, href: view.view}]
	})

	return campus === 'carleton' ? tiles : [...CAFE_MENUS, ...tiles]
}

/**
 * The destinations `ids` name, in the same order. An id that no longer names
 * one -- a tile renamed or removed since it was picked -- is dropped.
 */
export function resolveQuickActions(
	ids: string[],
	campus: Campus = 'stolaf',
): QuickActionDestination[] {
	let byId = new Map(quickActionDestinations(campus).map((d) => [d.id, d]))
	return ids.flatMap((id) => byId.get(id) ?? [])
}
