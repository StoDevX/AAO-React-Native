// @flow

import type {FilterType, ListType, PickerType, ToggleType} from './types'

export function filterListSpecs(specs: Array<FilterType>): Array<ListType> {
	let retval = specs.filter(f => f.type === 'list')
	return ((retval: any): Array<ListType>)
}

export function filterPickerSpecs(specs: Array<FilterType>): Array<PickerType> {
	let retval = specs.filter(f => f.type === 'picker')
	return ((retval: any): Array<PickerType>)
}

export function filterToggleSpecs(specs: Array<FilterType>): Array<ToggleType> {
	let retval = specs.filter(f => f.type === 'toggle')
	return ((retval: any): Array<ToggleType>)
}
