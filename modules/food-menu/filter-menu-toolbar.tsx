import * as React from 'react'
import {View} from 'react-native'
import type {FilterType} from '@frogpond/filter'
import {FilterToolbar} from '@frogpond/filter'

type Props<T extends object> = {
	isOpen: boolean
	onChange: (filter: FilterType<T>) => void
	filters: FilterType<T>[]
}

export function FilterMenuToolbar<T extends object>({
	isOpen,
	filters,
	onChange,
}: Props<T>): React.ReactNode {
	// The meal is chosen from the navigation bar, so its picker is drawn there.
	const nonPickerFilters = filters.filter((f) => f.type !== 'picker')

	// One View, because `RNHostView` hosts exactly one element and a closed
	// cafe's `isOpen &&` yields `false` rather than a view. `FilterToolbar`
	// paints its own background, so this one needs none.
	return (
		<View>{isOpen && <FilterToolbar<T> filters={nonPickerFilters} onChange={onChange} />}</View>
	)
}
