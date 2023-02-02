import type {Filter, ListFilter, PickerFilter, ToggleFilter} from './types'

export function filterListSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<ListFilter<T>> {
	let retval = specs.filter((f) => f.type === 'list')
	return retval as Array<ListFilter<T>>
}

export function filterPickerSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<PickerFilter<T>> {
	let retval = specs.filter((f: Filter<T>) => f.type === 'picker')
	return retval as Array<PickerFilter<T>>
}

export function filterToggleSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<ToggleFilter<T>> {
	let retval = specs.filter((f) => f.type === 'toggle')
	return retval as Array<ToggleFilter<T>>
}
