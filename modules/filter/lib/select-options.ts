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
 * Applies a selection reported by a SwiftUI `List(selection:)`, returning the
 * filter that results.
 *
 * The selection crosses that boundary as tags rather than options, since a tag
 * is what SwiftUI matches a selected row by, so this maps them back. A tag
 * matching no option selects nothing: the options come from the data, and can
 * change under a selection.
 */
export function selectByTitles<T extends object>(
	filter: ListType<T>,
	titles: readonly (string | number)[],
): ListType<T> {
	let wanted = new Set(titles.map(String))
	let result = filter.spec.options.filter((option) => wanted.has(option.title))

	return {
		...filter,
		enabled: narrowsAnything(result),
		spec: {...filter.spec, selected: result},
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
