import type {FilterType, ListItemSpecType, ListType, ToggleType} from './types'
import values from 'lodash/values'
import difference from 'lodash/difference'
import intersection from 'lodash/intersection'
import {isPlainObject, isString} from 'lodash'

type StringDict = Record<string, string | string[] | Record<string, string>>

export function applyFiltersToItem<T extends StringDict>(
	filters: FilterType[],
	item: T,
): boolean {
	// Given a list of filters, return the result of running all of those
	// filters over the item
	return filters.every((f) => applyFilter(f, item))
}

export function applyFilter<T extends StringDict>(
	filter: FilterType,
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

export function applyToggleFilter<T extends StringDict>(
	filter: ToggleType,
	item: T,
): boolean {
	// Dereference the value-to-check
	let itemValue = item[filter.apply.key]
	return filter.apply.trueEquivalent
		? itemValue === filter.apply.trueEquivalent
		: Boolean(itemValue)
}

export function applyListFilter<T extends StringDict>(
	filter: ListType,
	item: T,
): boolean {
	// Dereference the value-to-check
	let itemValue = item[filter.apply.key]
	// Extract the list of "selected" items
	let filterValue = filter.spec.selected

	switch (filter.spec.mode) {
		case 'OR':
			return applyOrListFilter(filterValue, itemValue)
		case 'AND':
			return applyAndListFilter(filterValue, itemValue)
		default:
			return true
	}
}

function isRecord(x: unknown): x is Record<string, string> {
	return isPlainObject(x)
}

export function applyOrListFilter(
	filterValue: ListItemSpecType[],
	itemValue: string | string[] | Record<string, string>,
): boolean {
	if (isRecord(itemValue)) {
		console.warn('cannot filter or-list with a record')
		return false
	}

	// An item passes, if its value is in the filter's selected items array
	if (!Array.isArray(itemValue)) {
		return filterValue.map((f) => f.title).includes(itemValue)
	}

	let valueToCheckAgainst = filterValue.map((f) => f.title.toString())
	let intersectionValues = intersection(valueToCheckAgainst, itemValue)
	return intersectionValues.length !== 0
}

export function applyAndListFilter(
	filterValue: ListItemSpecType[],
	itemValue: string | string[] | Record<string, string>,
): boolean {
	if (isString(itemValue)) {
		console.warn('cannot filter and-list with a string')
		return false
	}

	// In case the value is an object, instead of an array, convert it to an array
	if (!Array.isArray(itemValue)) {
		itemValue = values(itemValue)
	}

	// If there are no items, it cannot contain the item we're filtering by.
	if (!itemValue.length) {
		return false
	}

	// Check that the number of different items between the two lists is 0, to
	// ensure that all the restrictions we seek are present.
	let valueToCheckAgainst = filterValue.map((f) => f.title)
	let differentItems = difference(valueToCheckAgainst, itemValue)
	return differentItems.length === 0
}
