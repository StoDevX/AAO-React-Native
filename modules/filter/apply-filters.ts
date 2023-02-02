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
		default: {
			let unreachable: never = filter
			return unreachable
		}
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
	let itemValue = item[filter.field] as boolean | undefined
	return itemValue === true
}

function isArrayOfNumbers(arr: Array<unknown>): arr is Array<number> {
	return typeof arr[0] === 'number'
}

export function applyListFilter<T>(filter: ListFilter<T>, item: T): boolean {
	// We cast as `string|string[]` here because TS is confused about doing
	// the lookup back into the object. It correctly prevents you from using a
	// field name that isn't a string|string[], but it gets very confused when
	// we try to look up the value here - it thinks `item[filter.field]` is
	// `T[string|string[]]`, instead of `string|string[]`.
	let itemValues = item[filter.field] as string | string[] | undefined | number | number[]

	if (itemValues === undefined) {
		return true
	}

	let filterValues = filter.options
		.filter((_option, index) => filter.selectedIndices.includes(index))
		.map((option) => option.title)

	// ensure that itemValue is an Array<string>
	if (typeof itemValues === 'string') {
		// if it's a single string, wrap it in an array
		itemValues = [itemValues]
	} else if (typeof itemValues === 'number') {
		// if it's a single number, turn it into a string and wrap it in an array
		itemValues = [String(itemValues)]
	} else if (isArrayOfNumbers(itemValues)) {
		// if it's an array, go ahead and convert everything into a string
		itemValues = itemValues.map(String)
	}

	if (filter.mode === 'any') {
		// An item passes if its value is in the filter's selected items array
		let intersectionValues = intersection(filterValues, itemValues)
		return intersectionValues.length !== 0
	} else if (filter.mode === 'all') {
		// Check that the number of different items between the two lists is 0, to
		// ensure that all of the restrictions we're seeking are present.
		let differentItems = difference(filterValues, itemValues)
		return differentItems.length === 0
	} else {
		let unreachable: never = filter.mode
		return unreachable
	}
}
