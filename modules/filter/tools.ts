import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs(specs: Array<FilterType>): Array<ListType> {
	let retval = specs
		.filter((f) => f.type === 'list')
		.map((f: FilterType) => f as ListType)
	return retval
}

export function filterPickerSpecs(specs: Array<FilterType>): Array<PickerType> {
	let retval = specs
		.filter((f: FilterType) => f.type === 'picker')
		.map((f: FilterType) => f as PickerType)
	return retval
}

export function filterToggleSpecs(specs: Array<FilterType>): Array<ToggleType> {
	let retval = specs
		.filter((f) => f.type === 'toggle')
		.map((f) => f as ToggleType)
	return retval
}
