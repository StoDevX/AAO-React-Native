import type {ListItemSpecType, ListType} from '../types'

import concat from 'lodash/concat'
import isEqual from 'lodash/isEqual'
import reject from 'lodash/reject'

/**
 * Whether a list filter narrows anything.
 *
 * Selecting nothing is the resting state and shows everything, in either mode:
 * `applyFilter` returns `true` for every item of a disabled filter, so an empty
 * selection needs no special handling further down. Ticking is what narrows.
 */
function narrowsAnything(selected: ListItemSpecType[]): boolean {
	return selected.length > 0
}

/**
 * Applies a tap on one option of a list filter, returning the filter that
 * results.
 */
export function toggleOption<T extends object>(
	filter: ListType<T>,
	tappedValue: ListItemSpecType,
): ListType<T> {
	let {spec} = filter
	let {selected} = spec

	let result = selected.some((val) => isEqual(val, tappedValue))
		? reject(selected, (val) => isEqual(val, tappedValue))
		: concat(selected, tappedValue)

	return {
		...filter,
		enabled: narrowsAnything(result),
		spec: {...spec, selected: result},
	}
}

/**
 * Clears a list filter's selection, returning the filter that results — which
 * is the resting state, showing everything.
 */
export function clearSelection<T extends object>(filter: ListType<T>): ListType<T> {
	return {
		...filter,
		enabled: false,
		spec: {...filter.spec, selected: []},
	}
}
