import type {Filter, ListFilter, PickerFilter, ToggleFilter} from './types'

export function filterListSpecs<T extends object>(specs: Array<Filter<T>>): Array<ListFilter<T>> {
	return specs.filter((f) => f.type === 'list')
}

export function filterPickerSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<PickerFilter<T>> {
	return specs.filter((f) => f.type === 'picker')
}

export function filterToggleSpecs<T extends object>(
	specs: Array<Filter<T>>,
): Array<ToggleFilter<T>> {
	return specs.filter((f) => f.type === 'toggle')
}
