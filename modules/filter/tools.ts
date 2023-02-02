import type {Filter, ListFilter, ToggleFilter} from './types'

export function filterListSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<ListFilter<T>> {
	let retval = specs.filter((f) => f.type === 'list')
	return retval as Array<ListFilter<T>>
}

export function filterToggleSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<ToggleFilter<T>> {
	let retval = specs.filter((f) => f.type === 'toggle')
	return retval as Array<ToggleFilter<T>>
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