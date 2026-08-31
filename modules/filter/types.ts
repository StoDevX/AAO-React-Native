/**
 * A drawable icon for a filter option — either an SF Symbol or a local file.
 * These correspond to @expo/ui's Image systemName and uiImage respectively.
 */
export type FilterIcon = {kind: 'sfSymbol'; name: string} | {kind: 'localFile'; uri: string}

export type ToggleSpecType = {
	label: string
	title: string
}

export type ListItemSpecType = {
	title: string
	label?: string
	detail?: string
	/** The caller's own identifier for this option, passed back to `renderMark`. */
	id?: string
}

export type ListSpecType = {
	title: string
	showIcons?: boolean
	/**
	 * Draws a row's leading mark, for a caller whose marks are views rather than
	 * artwork. Lives on the spec rather than on each option so that it stays out
	 * of the equality check that decides which options are selected.
	 */
	renderMark?: (option: ListItemSpecType) => React.ReactElement | null
	/// Overrides the presentation `filterShape` would otherwise pick from the
	/// option count. A filter carrying icons is still always a sheet: a menu
	/// cannot draw them.
	presentation?: 'menu' | 'sheet'
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
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: ToggleSpecType
	apply: ToggleFilterFunctionType<T>
}

export type PickerType<T extends object> = {
	type: 'picker'
	key: string
	enabled: true
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: PickerSpecType
	apply: PickerFilterFunctionType<T>
}

export type ListType<T extends object> = {
	type: 'list'
	key: string
	enabled: boolean
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: ListSpecType
	apply: ListFilterFunctionType<T>
}

export type FilterType<T extends object> = ToggleType<T> | PickerType<T> | ListType<T>
