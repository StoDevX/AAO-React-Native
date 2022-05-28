import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs(specs: Array<FilterType>): Array<ListType> {
	let retval = specs.filter((f) => f.type === 'list')
	return retval as Array<ListType>
}

export function filterPickerSpecs(specs: Array<FilterType>): Array<PickerType> {
	let retval = specs.filter((f: FilterType) => f.type === 'picker')
	return retval as Array<PickerType>
}

export function filterToggleSpecs(specs: Array<FilterType>): Array<ToggleType> {
	let retval = specs.filter((f) => f.type === 'toggle')
	return retval as Array<ToggleType>
}
