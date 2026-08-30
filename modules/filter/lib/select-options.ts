import type {ListItemSpecType, ListType} from '../types'

import concat from 'lodash/concat'
import isEqual from 'lodash/isEqual'
import reject from 'lodash/reject'

/**
 * Applies a tap on one option of a list filter, returning the filter that
 * results.
 */
export function toggleOption<T extends object>(
	filter: ListType<T>,
	tappedValue: ListItemSpecType,
): ListType<T> {
	let {spec} = filter
	let {options, selected, mode} = spec
	let result

	if (mode === 'OR' && selected.length === options.length) {
		// if all options of an OR filter are selected and a user selects
		// an option, make that the only selected option
		result = [tappedValue]
	} else if (selected.some((val) => isEqual(val, tappedValue))) {
		// if the user has tapped an item, and it's already in the list of
		// things they've tapped, we want to _remove_ it from that list.
		result = reject(selected, (val) => isEqual(val, tappedValue))
	} else {
		// otherwise, we need to add it to the list
		result = concat(selected, tappedValue)
	}

	let enabled = false
	if (mode === 'OR') {
		enabled = result.length !== options.length
	} else if (mode === 'AND') {
		enabled = result.length > 0
	}

	return {
		...filter,
		enabled: enabled,
		spec: {...spec, selected: result},
	}
}

/**
 * Applies a tap on a list filter's "Show All" option, returning the filter
 * that results.
 */
export function toggleAll<T extends object>(filter: ListType<T>): ListType<T> {
	let {spec} = filter
	let {options, selected} = spec
	let result: ListItemSpecType[]

	if (selected.length === options.length) {
		// when all items are selected: uncheck them all
		result = []
	} else {
		// when one or more items are not checked: check them all
		result = options
	}

	return {
		...filter,
		enabled: result.length !== options.length,
		spec: {...spec, selected: result},
	}
}
