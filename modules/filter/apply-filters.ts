import type {FilterType, ListItemSpecType, ListType, ToggleType} from './types'
import {isPlainObject, values} from 'lodash'
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'

export function applyFiltersToItem<T extends object>(
	filters: FilterType<T>[],
	item: T,
): boolean {
	// Given a list of filters, return the result of running all of those
	// filters over the item
	return filters.every((f) => applyFilter(f, item))
}

export function applyFilter<T extends object>(
	filter: FilterType<T>,
	item: T,
): boolean {
	// if the filter is disabled, we don't want to filter at all, so we return
	// `true` for every item
	if (!filter.enabled) {
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

export function applyToggleFilter<T extends object>(
	filter: ToggleType<T>,
	item: T,
): boolean {
	// Dereference the value-to-check
	let itemValue = item[filter.apply.key]
	return filter.apply.trueEquivalent
		? itemValue === filter.apply.trueEquivalent
		: Boolean(itemValue)
}

function isArrayOfString(arr: unknown): arr is Array<string> {
	return Array.isArray(arr) && typeof arr[0] === 'string'
}

export function applyListFilter<T extends object>(
	filter: ListType<T>,
	item: T,
): boolean {
	// Dereference the value-to-check
	let rawItemValue = item[filter.apply.key]
	// Extract the list of "selected" items
	let filterValue = filter.spec.selected

	// coerce the item into an array
	let itemValue =
		typeof rawItemValue === 'string' ? [rawItemValue] : rawItemValue

	if (isPlainObject(rawItemValue)) {
		itemValue = values(rawItemValue)
	}

	// if it's not an array of strings, then let it through
	if (!isArrayOfString(itemValue)) {
		return true
	}

	switch (filter.spec.mode) {
		case 'OR':
			return applyOrListFilter(filterValue, itemValue)
		case 'AND':
			return applyAndListFilter(filterValue, itemValue)
		default:
			return true
	}
}

export function applyOrListFilter(
	filterValue: ListItemSpecType[],
	itemValue: string[],
): boolean {
	// An item passes if its value is in the filter's selected items array
	let valueToCheckAgainst = filterValue.map((f) => f.title.toString())
	let intersectionValues = intersection(valueToCheckAgainst, itemValue)
	return intersectionValues.length !== 0
}

export function applyAndListFilter(
	filterValue: ListItemSpecType[],
	itemValue: string[],
): boolean {
	// Check that the number of different items between the two lists is 0, to
	// ensure that all of the restrictions we're seeking are present.
	let valueToCheckAgainst = filterValue.map((f) => f.title)
	let differentItems = difference(valueToCheckAgainst, itemValue)
	return differentItems.length === 0
}
