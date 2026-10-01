export type ToggleFilterSpec = {
	label: string
	title: string
}

export type ListFilterOption = {
	title: string
	label?: string
	detail?: string
	/** The caller's own identifier for this option, passed back to `renderMark`. */
	id?: string
}

export type ListFilterSpec = {
	title: string
	/**
	 * Draws a row's leading mark, for a caller whose marks are views rather than
	 * artwork. Lives on the spec rather than on each option so that it stays out
	 * of the equality check that decides which options are selected.
	 */
	renderMark?: (option: ListFilterOption) => React.ReactElement | null
	/// Overrides the presentation `filterShape` would otherwise pick from the
	/// option count. A filter carrying icons is still always a sheet: a menu
	/// cannot draw them.
	presentation?: 'menu' | 'sheet'
	options: ListFilterOption[]
	selected: ListFilterOption[]
	mode: 'AND' | 'OR'
	displayTitle: boolean
}

export type PickerFilterOption = {
	label: string
}

export type PickerFilterSpec = {
	title: string
	options: PickerFilterOption[]
	selected?: PickerFilterOption
}

export type ToggleFilterApply<T extends object> = {
	key: keyof T
	trueEquivalent?: string
}

export type PickerFilterApply<T extends object> = {
	key: keyof T
}

export type ListFilterApply<T extends object> = {
	key: keyof T
}

export type ToggleFilter<T extends object> = {
	type: 'toggle'
	key: string
	enabled: boolean
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: ToggleFilterSpec
	apply: ToggleFilterApply<T>
}

export type PickerFilter<T extends object> = {
	type: 'picker'
	key: string
	enabled: true
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: PickerFilterSpec
	apply: PickerFilterApply<T>
}

export type ListFilter<T extends object> = {
	type: 'list'
	key: string
	enabled: boolean
	/// Drawn, but not operable -- the filter is offered so the toolbar keeps
	/// its shape, while this meal or feed gives it nothing to act on.
	disabled?: boolean
	spec: ListFilterSpec
	apply: ListFilterApply<T>
}

export type Filter<T extends object> = ToggleFilter<T> | PickerFilter<T> | ListFilter<T>
