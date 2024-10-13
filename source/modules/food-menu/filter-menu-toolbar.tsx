import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment'
import type {FilterType} from '../filter'
import {FilterToolbar, FilterToolbarButton} from '../filter'
import {Toolbar} from '../toolbar'
import * as c from '../colors'

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

interface Props<T extends object> {
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
}: Props<T>): React.JSX.Element {
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
					<Text style={styles.toolbarText}>{date.format('MMM Do')}</Text>
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
