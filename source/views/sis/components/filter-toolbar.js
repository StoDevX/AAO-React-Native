// @flow
import * as React from 'react'
import {type FilterType, filterListSpecs} from '../../components/filter'
import {StyleSheet, Text, View, Platform} from 'react-native'
import {Toolbar, ToolbarButton} from '../../components/toolbar'
import {formatTerms} from '../course-search/lib/format-terms'

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarSection: {
		flexDirection: 'row',
	},
	filterButton: {
		marginLeft: 8,
	},
})

type Props = {
	filters: Array<FilterType>,
	onPress: (filterCategories: FilterType[]) => any,
}

export function FilterToolbar({filters, onPress}: Props) {
	const appliedFilterCount = filters.filter(f => f.enabled).length
	const isFiltered = appliedFilterCount > 0

	const filterToggles = filters.map(filter => (
		<ToolbarButton
			iconName={Platform.OS === 'ios' ? 'ios-arrow-down' : 'md-arrow-dropdown'}
			isActive={filter.enabled}
			key={filter.spec.title}
			onPress={() => {
				onPress([filter])
			}}
			title={filter.spec.title}
		/>
	))

	return (
		<Toolbar>
			<ToolbarButton
				iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
				isActive={isFiltered}
				onPress={() => {
					onPress(filters)
				}}
				style={styles.filterButton}
				title="Filters"
			/>
			{filterToggles}
		</Toolbar>
	)
}
