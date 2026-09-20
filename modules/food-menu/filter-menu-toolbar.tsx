import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import type {FilterType} from '@frogpond/filter'
import {FilterToolbar} from '@frogpond/filter'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	bars: {
		backgroundColor: c.systemGroupedBackground,
	},
})

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
	// The meal is chosen from the navigation bar, so its picker is drawn there
	// rather than in this bar.
	const nonPickerFilters = filters.filter((f) => f.type !== 'picker')

	// The view carries the bar's own background: `RNHostView` sizes to it, and
	// the SwiftUI host shows through anything it does not paint.
	return (
		<View style={styles.bars}>
			{isOpen && <FilterToolbar<T> filters={nonPickerFilters} onChange={onChange} />}
		</View>
	)
}
