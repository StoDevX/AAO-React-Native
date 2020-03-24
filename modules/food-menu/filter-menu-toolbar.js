// @flow
import * as React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import type momentT from 'moment'
import {
	type FilterType,
	FilterToolbar,
	FilterToolbarButton,
} from '@frogpond/filter'
import {Toolbar} from '@frogpond/toolbar'

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
	isOpen: boolean,
	title?: string,
	onPopoverDismiss: (filter: FilterType) => any,
	filters: FilterType[],
}

export function FilterMenuToolbar({
	date,
	isOpen,
	title,
	filters,
	onPopoverDismiss,
}: PropsType) {
	let mealFilter = filters.find(f => f.type === 'picker')
	let multipleMeals =
		mealFilter && mealFilter.type === 'picker'
			? mealFilter.spec.options.length > 1
			: false
	let nonPickerFilters = filters.filter(f => f.type !== 'picker')

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
			{isOpen && (
				<FilterToolbar
					filters={nonPickerFilters}
					onPopoverDismiss={onPopoverDismiss}
				/>
			)}
		</React.Fragment>
	)
}
