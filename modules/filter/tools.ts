import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<ListType<T>> {
	return specs.filter((f) => f.type === 'list')
}

export function filterPickerSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<PickerType<T>> {
	return specs.filter((f) => f.type === 'picker')
}

export function filterToggleSpecs<T extends object>(
	specs: Array<FilterType<T>>,
): Array<ToggleType<T>> {
	return specs.filter((f) => f.type === 'toggle')
}
