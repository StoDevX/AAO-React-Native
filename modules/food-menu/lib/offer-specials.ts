import type {FilterType} from '@frogpond/filter'

import type {MenuItemType} from '../types'

/**
 * The specials toggle, against the meal actually on screen.
 *
 * Showing only the specials is the useful default — the full list carries every
 * condiment and salad dressing the location stocks. But the toggle is seeded
 * once, from whichever meal was showing when the filters were built, and the
 * meal moves: the clock rolls into the next one, or the user picks another. A
 * meal with no specials of its own — Brunch, most days — would otherwise keep
 * the filter applied and render nothing at all.
 *
 * So a meal with nothing special still offers the toggle, drawn but disabled
 * and forced off. Removing it instead takes the control out of the toolbar
 * exactly when the reader most wants to see its state — and if it were somehow
 * left on, there would be nothing left on screen to turn it off with.
 */
export function offerSpecials(
	filters: FilterType<MenuItemType>[],
	mealHasSpecials: boolean,
): FilterType<MenuItemType>[] {
	if (mealHasSpecials) {
		return filters
	}

	return filters.map((filter): FilterType<MenuItemType> =>
		// Narrowed on `type` as well as `key`: a picker's `enabled` is typed
		// `true`, so spreading `false` over the bare union widens it out of
		// `FilterType`.
		filter.type === 'toggle' && filter.key === 'specials'
			? {...filter, enabled: false, disabled: true}
			: filter,
	)
}
