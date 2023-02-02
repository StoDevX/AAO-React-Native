import {ImageURISource} from 'react-native'

export type ToggleSpec = {
	label: string
	title: string
	caption?: string
}

export type ListSpecItem = {
	title: string
	label?: string
	detail?: string
	image?: ImageURISource | null
}

export type ListSpec = {
	title: string
	caption?: string
	showImages?: boolean
	options: ListSpecItem[]
	selected: ListSpecItem[]
	mode: 'AND' | 'OR'
	displayTitle: boolean
}

export type PickerSpecItem = {
	label: string
}

export type PickerSpec = {
	title: string
	caption?: string
	options: PickerSpecItem[]
	selected?: PickerSpecItem
}

export type ToggleFilterFunction<T extends object> = {
	key: keyof T
	trueEquivalent?: string
}

export type PickerFilterFunction<T extends object> = {
	key: keyof T
}

export type ListFilterFunction<T extends object> = {
	key: keyof T
}

export type ToggleFilter<T extends object> = {
	type: 'toggle'
	key: string
	enabled: boolean
	spec: ToggleSpec
	apply: ToggleFilterFunction<T>
}

export type PickerFilter<T extends object> = {
	type: 'picker'
	key: string
	enabled: true
	spec: PickerSpec
	apply: PickerFilterFunction<T>
}

export type ListFilter<T extends object> = {
	type: 'list'
	key: string
	enabled: boolean
	spec: ListSpec
	apply: ListFilterFunction<T>
}

export type Filter<T extends object> =
	| ToggleFilter<T>
	| PickerFilter<T>
	| ListFilter<T>
