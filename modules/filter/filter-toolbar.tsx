import * as React from 'react'
import type {FilterIcon, FilterType, ListItemSpecType} from './types'
import {ScrollView, StyleSheet} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'

type Props<T extends object> = {
	filters: Array<FilterType<T>>
	onChange: (filter: FilterType<T>) => unknown
	/// Forwarded to each `FilterToolbarButton`, and from there to the sheet
	/// only -- see the `FilterIcon` contract in `types.ts`.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

export function FilterToolbar<T extends object>({
	filters,
	iconFor,
	onChange,
}: Props<T>): React.ReactNode {
	let filterToggles = filters.map((filter) => (
		<FilterToolbarButton<T>
			key={filter.spec.title}
			filter={filter}
			iconFor={iconFor}
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
		paddingLeft: 10,
		paddingVertical: 8,
	},
})
