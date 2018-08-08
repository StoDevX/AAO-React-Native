// @flow
import * as React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import type momentT from 'moment'
import type {FilterType} from '../../components/filter'
import {FilterToolbar, FilterToolbarButton} from '../../components/filter'
import {Toolbar} from '../../components/toolbar'

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})

type PropsType = {
	date: momentT,
	title?: string,
	onPopoverDismiss: (filter: FilterType) => any,
	filters: FilterType[],
}

export function FilterMenuToolbar({
	date,
	title,
	filters,
	onPopoverDismiss,
}: PropsType) {
	const mealFilter = filters.find(f => f.key === 'meals')
	const multipleMeals = mealFilter.spec.options.length > 1
	const nonPickerFilters = filters.filter(f => f.type !== 'picker')
	return (
		<View>
			<Toolbar>
				<View style={[styles.toolbarSection, styles.today]}>
					<Text>
						<Text>{date.format('MMM. Do')}</Text>
						{title ? <Text> — {title}</Text> : null}
					</Text>
				</View>
				{multipleMeals && (
					<FilterToolbarButton
						filter={mealFilter}
						iconName={
							Platform.OS === 'ios' ? 'ios-arrow-down' : 'md-arrow-dropdown'
						}
						isActive={true}
						onPopoverDismiss={onPopoverDismiss}
						title={mealFilter.spec.title}
					/>
				)}
			</Toolbar>
			<FilterToolbar
				filters={nonPickerFilters}
				onPopoverDismiss={onPopoverDismiss}
			/>
		</View>
	)
}
