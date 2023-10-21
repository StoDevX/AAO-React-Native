import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'
import type {FilterType} from '@frogpond/filter'
import {FilterToolbar, FilterToolbarButton} from '@frogpond/filter'
import {Toolbar} from '@frogpond/toolbar'

import type {Moment} from 'moment'

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarText: {
		color: c.label,
	},
	toolbarSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})

type Props<T extends object> = {
	date: Moment
	isOpen: boolean
	title?: string
	onPopoverDismiss: (filter: FilterType<T>) => void
	filters: FilterType<T>[]
}

export function FilterMenuToolbar<T extends object>({
	date,
	isOpen,
	title,
	filters,
	onPopoverDismiss,
}: Props<T>): JSX.Element {
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
					<Text style={styles.toolbarText}>{date.format('MMM. Do')}</Text>
					{title ? <Text style={styles.toolbarText}> — {title}</Text> : null}
				</View>
				{mealFilter && multipleMeals ? (
					<FilterToolbarButton<T>
						filter={mealFilter}
						isActive={true}
						onPopoverDismiss={onPopoverDismiss}
						title={mealFilter.spec.title}
					/>
				) : null}
			</Toolbar>
			{isOpen && (
				<FilterToolbar<T>
					filters={nonPickerFilters}
					onPopoverDismiss={onPopoverDismiss}
				/>
			)}
		</>
	)
}
