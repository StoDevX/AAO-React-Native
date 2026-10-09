import type {CampusDefinition} from '../../campuses'
import type {ViewType} from '../views'

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

/** `view` as a destination, if it opens a screen in the app by a plain path. */
function destinationOf(view: ViewType): QuickActionDestination[] {
	if (view.type !== 'view' || typeof view.view !== 'string') {
		return []
	}
	return [{id: view.title, title: view.title, icon: view.icon, href: view.view}]
}

/**
 * Every screen the quick-action picker offers on `campus`: its café menus, an
 * action each though Home has one Menus tile for all of them, then each Home
 * tile that opens a screen in the app. A tile that opens a café's screen is
 * left out, since that café's action already does.
 */
export function quickActionDestinations(campus: CampusDefinition): QuickActionDestination[] {
	let cafes = (campus.menus?.quickActions ?? []).flatMap(destinationOf)
	let cafeHrefs = new Set(cafes.map((cafe) => cafe.href))
	let tiles = campus.home.tiles
		.filter((view) => !view.disabled && !view.devOnly)
		.flatMap(destinationOf)
		.filter((tile) => !cafeHrefs.has(tile.href))
	return [...cafes, ...tiles]
}

/**
 * The destinations `ids` name, in the same order. An id that no longer names
 * one -- a tile renamed or removed since it was picked -- is dropped.
 */
export function resolveQuickActions(
	ids: ReadonlyArray<string>,
	campus: CampusDefinition,
): QuickActionDestination[] {
	let byId = new Map(quickActionDestinations(campus).map((d) => [d.id, d]))
	return ids.flatMap((id) => byId.get(id) ?? [])
}
