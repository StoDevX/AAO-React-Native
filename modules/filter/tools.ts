import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs<T extends object>(
	specs: FilterType<T>[],
): ListType<T>[] {
	return specs.filter((f) => f.type === 'list')
}

export function filterPickerSpecs<T extends object>(
	specs: FilterType<T>[],
): PickerType<T>[] {
	return specs.filter((f) => f.type === 'picker')
}

export function filterToggleSpecs<T extends object>(
	specs: FilterType<T>[],
): ToggleType<T>[] {
	return specs.filter((f) => f.type === 'toggle')
}
