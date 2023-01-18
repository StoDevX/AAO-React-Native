import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<ListType<T>> {
	let retval = specs.filter((f) => f.type === 'list')
	return retval as Array<ListType<T>>
}

export function filterPickerSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<PickerType<T>> {
	let retval = specs.filter((f: FilterType<T>) => f.type === 'picker')
	return retval as Array<PickerType<T>>
}

export function filterToggleSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<ToggleType<T>> {
	let retval = specs.filter((f) => f.type === 'toggle')
	return retval as Array<ToggleType<T>>
}
