// @flow
import * as React from 'react'
import type {FilterType} from '../../components/filter'
import {StyleSheet, Text, View, Platform} from 'react-native'
import {Toolbar, ToolbarButton} from '../../components/toolbar'

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarSection: {
		flexDirection: 'row',
	},
})

type Props = {
	filters: Array<FilterType>,
	onPress: () => any,
}

export function FilterToolbar({filters, onPress}: Props) {
	const appliedFilterCount = filters.filter(f => f.enabled).length
	const isFiltered = appliedFilterCount > 0
	const filterWord = appliedFilterCount === 1 ? 'Filter' : 'Filters'
	const termFilter = filters.find(f => f.key === 'term')
	const selectedTerms =
		termFilter && termFilter.spec.selected
			? termFilter.spec.selected
			: []
	const termMessage = termFilter && termFilter.enabled ? 'No Terms' : 'All Terms'
	const title = termFilter && termFilter.enabled && selectedTerms.length !== 0
		? selectedTerms.map(t => t.label).join(', ')
		: termMessage

	return (
		<Toolbar onPress={onPress}>
			<View style={[styles.toolbarSection, styles.today]}>
				<Text ellipsizeMode="tail" numberOfLines={1}>
					<Text>{title}</Text>
				</Text>
			</View>

			<ToolbarButton
				iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
				isActive={isFiltered}
				title={
					isFiltered ? `${appliedFilterCount} ${filterWord}` : 'No Filters'
				}
			/>
		</Toolbar>
	)
}
