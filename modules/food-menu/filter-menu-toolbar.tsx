import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment'
import type {FilterType} from '@frogpond/filter'
import {FilterToolbar, FilterToolbarButton} from '@frogpond/filter'
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

type Props = {
	date: Moment
	isOpen: boolean
	title?: string
	onPopoverDismiss: (filter: FilterType) => void
	filters: FilterType[]
}

export function FilterMenuToolbar({
	date,
	isOpen,
	title,
	filters,
	onPopoverDismiss,
}: Props): JSX.Element {
	const mealFilter = filters.find((f) => f.type === 'picker')
	const multipleMeals =
		mealFilter && mealFilter.type === 'picker'
			? mealFilter.spec.options.length > 1
			: false
	const nonPickerFilters = filters.filter((f) => f.type !== 'picker')

	return (
		<>
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
		</>
	)
}
