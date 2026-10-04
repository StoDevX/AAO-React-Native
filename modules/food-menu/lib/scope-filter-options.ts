import type {Filter, ListFilter, ListFilterOption} from '@frogpond/filter/types'

import type {MenuItemType} from '../types'
import {applyMenuFilters} from './apply-menu-filters'

/**
 * Whether any item in the meal answers to `option` when it alone is chosen,
 * by the menu's own matching, so a mark that stands in for another counts.
 */
function mealServes(
	filter: ListFilter<MenuItemType>,
	option: ListFilterOption,
	items: MenuItemType[],
): boolean {
	let alone: ListFilter<MenuItemType> = {
		...filter,
		enabled: true,
		spec: {...filter.spec, selected: [option]},
	}
	return items.some((item) => applyMenuFilters([alone], item))
}

/**
 * The filters, as they apply to the meal actually on screen.
 *
 * A list filter is built from the whole day, so it offers a station another
 * meal serves and a dietary mark no dish here carries; choosing one draws
 * nothing. Each list keeps the options this meal serves. A selection made in
 * another meal is dropped from the view, and a list left with none selected is
 * off, rather than emptying a meal it has nothing to do with.
 *
 * Derived from the user's filters rather than written into them, so moving
 * back to the meal that served a selection restores it.
 */
export function scopeFilterOptions(
	filters: Filter<MenuItemType>[],
	items: MenuItemType[],
): Filter<MenuItemType>[] {
	return filters.map((filter): Filter<MenuItemType> => {
		if (filter.type !== 'list') {
			return filter
		}

		let options = filter.spec.options.filter((option) => mealServes(filter, option, items))
		let served = new Set(options.map((option) => option.title))
		let selected = filter.spec.selected.filter((option) => served.has(option.title))

		return {
			...filter,
			enabled: filter.enabled && selected.length > 0,
			spec: {...filter.spec, options, selected},
		}
	})
}
