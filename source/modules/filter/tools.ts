import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs<T extends object>(
	specs: FilterType<T>[],
): ListType<T>[] {
	let retval = specs.filter((f) => f.type === 'list')
	return retval
}

export function filterPickerSpecs<T extends object>(
	specs: FilterType<T>[],
): PickerType<T>[] {
	let retval = specs.filter((f: FilterType<T>) => f.type === 'picker')
	return retval
}

export function filterToggleSpecs<T extends object>(
	specs: FilterType<T>[],
): ToggleType<T>[] {
	let retval = specs.filter((f) => f.type === 'toggle')
	return retval
}
