// @flow
export type ToggleSpecType = {
	label: string,
	title?: string,
	caption?: string,
}

export type ListItemSpecType = {|
	title: string,
	detail?: string,
	image?: ?any,
|}

export type ListSpecType = {
	title?: string,
	caption?: string,
	showImages?: boolean,
	options: ListItemSpecType[],
	selected: ListItemSpecType[],
	mode: 'AND' | 'OR',
}

export type PickerItemSpecType = {|
	label: string,
|}

export type PickerSpecType = {
	title?: string,
	caption?: string,
	options: PickerItemSpecType[],
	selected: ?PickerItemSpecType,
}

export type ToggleFilterFunctionType = {
	key: string,
}

export type PickerFilterFunctionType = {
	key: string,
}

export type ListFilterFunctionType = {
	key: string,
}

export type ToggleType = {
	type: 'toggle',
	key: string,
	enabled: boolean,
	spec: ToggleSpecType,
	apply: ToggleFilterFunctionType,
}

export type PickerType = {
	type: 'picker',
	key: string,
	enabled: true,
	spec: PickerSpecType,
	apply: PickerFilterFunctionType,
}

export type ListType = {
	type: 'list',
	key: string,
	enabled: boolean,
	spec: ListSpecType,
	apply: ListFilterFunctionType,
}

export type FilterType = ToggleType | PickerType | ListType
