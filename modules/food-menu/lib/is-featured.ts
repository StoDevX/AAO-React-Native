import type {MenuItemType} from '../types'

/** Bon Appétit's tier for its Additional Favorites, the last tier worth featuring. */
const LAST_FEATURED_TIER = 2

/**
 * Whether an item belongs on the short menu the specials toggle shows.
 *
 * Bon Appétit files every item under a tier: its Specials, its Additional
 * Favorites, and its Condiments and Extras. The first two are the food; the
 * third is every sauce and topping the cafe stocks. Only the specials are
 * marked `special`, so going by the mark alone leaves The Cage's burgers and
 * wraps behind with the ketchup.
 *
 * An item without a tier -- The Pause's menu, or one from a server that does
 * not pass it along -- goes by its mark.
 */
export function isFeatured(item: MenuItemType): boolean {
	if (item.tier === undefined) {
		return Boolean(item.special)
	}

	return item.tier <= LAST_FEATURED_TIER
}
