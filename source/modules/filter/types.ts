import {ImageSourcePropType} from 'react-native'

export interface ToggleSpecType {
	label: string
	title: string
	caption?: string
}

export interface ListItemSpecType {
	title: string
	label?: string
	detail?: string
	image?: ImageSourcePropType | null
}

export interface ListSpecType {
	title: string
	caption?: string
	showImages?: boolean
	options: ListItemSpecType[]
	selected: ListItemSpecType[]
	mode: 'AND' | 'OR'
	displayTitle: boolean
}

export interface PickerItemSpecType {
	label: string
}

export interface PickerSpecType {
	title: string
	caption?: string
	options: PickerItemSpecType[]
	selected?: PickerItemSpecType
}

export interface ToggleFilterFunctionType<T extends object> {
	key: keyof T
	trueEquivalent?: string
}

export interface PickerFilterFunctionType<T extends object> {
	key: keyof T
}

export interface ListFilterFunctionType<T extends object> {
	key: keyof T
}

export interface ToggleType<T extends object> {
	type: 'toggle'
	key: string
	enabled: boolean
	spec: ToggleSpecType
	apply: ToggleFilterFunctionType<T>
}

export interface PickerType<T extends object> {
	type: 'picker'
	key: string
	enabled: true
	spec: PickerSpecType
	apply: PickerFilterFunctionType<T>
}

export interface ListType<T extends object> {
	type: 'list'
	key: string
	enabled: boolean
	spec: ListSpecType
	apply: ListFilterFunctionType<T>
}

export type FilterType<T extends object> =
	| ToggleType<T>
	| PickerType<T>
	| ListType<T>
