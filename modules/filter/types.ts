import {ImageSourcePropType} from 'react-native'

export type ToggleSpecType = {
	label: string
	title: string
	caption?: string
}

export type ListItemSpecType = {
	title: string
	label?: string
	detail?: string
	image?: ImageSourcePropType | null
	/** The caller's own identifier for this option, passed back to `renderMark`. */
	id?: string
}

export type ListSpecType = {
	title: string
	caption?: string
	showImages?: boolean
	/**
	 * Draws a row's leading mark, for a caller whose marks are views rather than
	 * artwork. Lives on the spec rather than on each option so that it stays out
	 * of the equality check that decides which options are selected.
	 */
	renderMark?: (option: ListItemSpecType) => React.ReactElement | null
	options: ListItemSpecType[]
	selected: ListItemSpecType[]
	mode: 'AND' | 'OR'
	displayTitle: boolean
}

export type PickerItemSpecType = {
	label: string
}

export type PickerSpecType = {
	title: string
	caption?: string
	options: PickerItemSpecType[]
	selected?: PickerItemSpecType
}

export type ToggleFilterFunctionType<T extends object> = {
	key: keyof T
	trueEquivalent?: string
}

export type PickerFilterFunctionType<T extends object> = {
	key: keyof T
}

export type ListFilterFunctionType<T extends object> = {
	key: keyof T
}

export type ToggleType<T extends object> = {
	type: 'toggle'
	key: string
	enabled: boolean
	spec: ToggleSpecType
	apply: ToggleFilterFunctionType<T>
}

export type PickerType<T extends object> = {
	type: 'picker'
	key: string
	enabled: true
	spec: PickerSpecType
	apply: PickerFilterFunctionType<T>
}

export type ListType<T extends object> = {
	type: 'list'
	key: string
	enabled: boolean
	spec: ListSpecType
	apply: ListFilterFunctionType<T>
}

export type FilterType<T extends object> = ToggleType<T> | PickerType<T> | ListType<T>
