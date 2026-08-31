import * as React from 'react'
import type {FilterType} from './types'
import {ScrollView, StyleSheet} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'

type Props<T extends object> = {
	filters: Array<FilterType<T>>
	onChange: (filter: FilterType<T>) => unknown
}

export function FilterToolbar<T extends object>({filters, onChange}: Props<T>): React.ReactNode {
	let filterToggles = filters.map((filter) => (
		<FilterToolbarButton<T>
			key={filter.spec.title}
			filter={filter}
			isActive={filter.enabled}
			onChange={onChange}
			title={filter.spec.title}
		/>
	))

	return (
		<Toolbar>
			<ScrollView
				contentContainerStyle={styles.scroller}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{filterToggles}
			</ScrollView>
		</Toolbar>
	)
}

const styles = StyleSheet.create({
	scroller: {
		// Symmetric, so the trailing trigger sits off the bar's edge the way the
		// leading one does. `columnGap` (not per-button margins) spaces the row
		// itself, matching the 8pt unit `filter-sheet.tsx`'s own rows use for the
		// gap between an icon and its label.
		paddingHorizontal: 12,
		paddingVertical: 8,
		columnGap: 8,
	},
})
