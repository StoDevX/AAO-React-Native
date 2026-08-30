import * as React from 'react'
import type {FilterType} from './types'
import {ScrollView, StyleSheet} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'

type Props<T extends object> = {
	filters: Array<FilterType<T>>
	onPopoverDismiss: (filter: FilterType<T>) => unknown
}

export function FilterToolbar<T extends object>({
	filters,
	onPopoverDismiss,
}: Props<T>): React.ReactNode {
	let filterToggles = filters.map((filter) => (
		<FilterToolbarButton<T>
			key={filter.spec.title}
			filter={filter}
			isActive={filter.enabled}
			onPopoverDismiss={onPopoverDismiss}
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
