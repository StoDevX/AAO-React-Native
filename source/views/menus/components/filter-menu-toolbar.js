// @flow
import * as React from 'react'
import {StyleSheet, View, Text} from 'react-native'
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
	const mealFilter = filters.find(f => f.type === 'picker')
	const multipleMeals =
		mealFilter && mealFilter.type === 'picker'
			? mealFilter.spec.options.length > 1
			: false
	const nonPickerFilters = filters.filter(f => f.type !== 'picker')

	return (
		<React.Fragment>
			<Toolbar>
				<View style={[styles.toolbarSection, styles.today]}>
					<Text>{date.format('MMM. Do')}</Text>
					{title ? <Text> — {title}</Text> : null}
				</View>
				{mealFilter && multipleMeals ? (
					<FilterToolbarButton
						filter={mealFilter}
						isActive={true}
						onPopoverDismiss={onPopoverDismiss}
						title={mealFilter.spec.title}
					/>
				) : null}
			</Toolbar>
			<FilterToolbar
				filters={nonPickerFilters}
				onPopoverDismiss={onPopoverDismiss}
			/>
		</React.Fragment>
	)
}
