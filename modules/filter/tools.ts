import type {Filter, ListFilter, ToggleFilter} from './types'

export function isListFilter<T>(filter: Filter<T>): filter is ListFilter<T> {
	return filter.type === 'list'
}

export function isToggleFilter<T>(
	filter: Filter<T>,
): filter is ToggleFilter<T> {
	return filter.type === 'toggle'
}

export function isFilterEnabled<T>(filter: Filter<T>): boolean {
	if (filter.type === 'toggle') {
		return filter.active === true
	} else if (filter.type === 'list') {
		return filter.selectedIndices.length > 0
	} else {
		let unreachable: never = filter
		return unreachable
	}
}
