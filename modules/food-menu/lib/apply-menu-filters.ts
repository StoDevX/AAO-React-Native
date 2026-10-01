// Sub-paths, not the barrel: it reaches the filter toolbar and its SwiftUI
// symbols, which cannot load under Jest.
import {applyFilter} from '@frogpond/filter/apply-filters'
import type {Filter, ListFilter} from '@frogpond/filter/types'

import type {ItemCorIconMapType, MenuItemType} from '../types'
import {isFeatured} from './is-featured'

const DIETARY_FILTER_KEY = 'dietary-restrictions'
const SPECIALS_FILTER_KEY = 'specials'

/**
 * Marks that another mark stands in for. All vegan food is vegetarian, but the
 * cafe tags a dish one or the other and never both -- of The Cage's 147 items,
 * 58 are Vegetarian, 55 are Vegan, and none carry both -- so a reader filtering
 * for Vegetarian would lose every vegan dish on the menu.
 *
 * One-way on purpose: vegan food satisfies a vegetarian, but vegetarian food
 * does not satisfy a vegan.
 *
 * Keyed by the cafe's own label, which is what the filter's options carry.
 *
 * @see https://github.com/StoDevX/AAO-React-Native/issues/7101
 */
const ALSO_SATISFIED_BY: Record<string, readonly string[]> = {
	Vegetarian: ['Vegan'],
}

function isDietaryFilter(filter: Filter<MenuItemType>): filter is ListFilter<MenuItemType> {
	return filter.type === 'list' && filter.key === DIETARY_FILTER_KEY
}

/**
 * Whether an item carries every dietary mark asked of it, counting a mark that
 * stands in for one of them.
 */
export function meetsDietaryMarks(
	selected: {title: string}[],
	corIcon: ItemCorIconMapType,
): boolean {
	let marks = new Set(Object.values(corIcon))

	return selected.every(
		(option) =>
			marks.has(option.title) ||
			(ALSO_SATISFIED_BY[option.title]?.some((stand) => marks.has(stand)) ?? false),
	)
}

function isSpecialsFilter(filter: Filter<MenuItemType>): boolean {
	return filter.type === 'toggle' && filter.key === SPECIALS_FILTER_KEY
}

/**
 * The menu's own filtering: `applyFiltersToItem`, except that the dietary list
 * honours the marks that stand in for one another, and the specials toggle
 * keeps every featured item rather than only those marked special.
 */
export function applyMenuFilters(filters: Filter<MenuItemType>[], item: MenuItemType): boolean {
	return filters.every((filter) => {
		if (!filter.enabled) {
			return true
		}

		if (isDietaryFilter(filter)) {
			return meetsDietaryMarks(filter.spec.selected, item.cor_icon)
		}

		if (isSpecialsFilter(filter)) {
			return isFeatured(item)
		}

		return applyFilter(filter, item)
	})
}
