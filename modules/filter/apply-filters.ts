import type {Filter, ToggleFilter, ListFilter} from './types'
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'
import {isFilterEnabled} from './tools'

export function applyFiltersToItem<T>(filters: Filter<T>[], item: T): boolean {
	// Given a list of filters, return the result of running all of those
	// filters over the item
	return filters.every((f) => applyFilter(f, item))
}

export function applyFilter<T>(filter: Filter<T>, item: T): boolean {
	// if the filter is disabled, we don't want to filter at all, so we return
	// `true` for every item
	if (!isFilterEnabled(filter)) {
		return true
	}

	// otherwise, we apply the appropriate filter to the item
	switch (filter.type) {
		case 'toggle':
			return applyToggleFilter(filter, item)
		case 'list':
			return applyListFilter(filter, item)
		default:
			return true
	}
}

export function applyToggleFilter<T>(
	filter: ToggleFilter<T>,
	item: T,
): boolean {
	// We cast as `boolean` here because TS is confused about doing the lookup
	// back into the object. It correctly prevents you from using a field name
	// that isn't a boolean, but it gets very confused when we try to look up
	// the value here - it thinks `item[filter.field]` is `T[boolean]`,
	// instead of `boolean`.
	let itemValue = item[filter.field] as boolean
	return itemValue === true
}

export function applyListFilter<T>(filter: ListFilter<T>, item: T): boolean {
	// We cast as `string|string[]` here because TS is confused about doing
	// the lookup back into the object. It correctly prevents you from using a
	// field name that isn't a string|string[], but it gets very confused when
	// we try to look up the value here - it thinks `item[filter.field]` is
	// `T[string|string[]]`, instead of `string|string[]`.
	let itemValue = item[filter.field] as string | string[]

	let filterValues = filter.options
		.filter((_option, index) => filter.selectedIndices.includes(index))
		.map((option) => option.title)

	// ensure that itemValue is an Array<string>
	if (typeof itemValue === 'string') {
		itemValue = [itemValue]
	}

	if (filter.mode === 'any') {
		// An item passes if its value is in the filter's selected items array
		let intersectionValues = intersection(filterValues, itemValue)
		return intersectionValues.length !== 0
	} else if (filter.mode === 'all') {
		// Check that the number of different items between the two lists is 0, to
		// ensure that all of the restrictions we're seeking are present.
		let differentItems = difference(filterValues, itemValue)
		return differentItems.length === 0
	} else {
		let unreachable: never = filter.mode
		return unreachable
	}
}
