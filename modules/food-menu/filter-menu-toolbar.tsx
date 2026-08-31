import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment'
import type {FilterIcon, FilterType, ListItemSpecType} from '@frogpond/filter'
import {FilterToolbar, FilterToolbarButton} from '@frogpond/filter'
import {Toolbar} from '@frogpond/toolbar'
import * as c from '@frogpond/colors'

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
	// Balances the date's own 12pt leading inset, so the meal picker doesn't
	// sit flush against the bar's trailing edge. The filter bar below uses the
	// same 12pt on both sides, and the two bars are read as one block.
	mealPicker: {
		paddingRight: 12,
	},
	bars: {
		backgroundColor: c.systemGroupedBackground,
	},
})

type Props<T extends object> = {
	date: Moment
	isOpen: boolean
	title?: string
	onChange: (filter: FilterType<T>) => void
	filters: FilterType<T>[]
	/// Forwarded to `FilterToolbar` -- the meal picker's own button never
	/// carries icons, so this goes no further than that.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

export function FilterMenuToolbar<T extends object>({
	date,
	isOpen,
	title,
	filters,
	iconFor,
	onChange,
}: Props<T>): React.ReactNode {
	const mealFilter = filters.find((f) => f.type === 'picker')
	const multipleMeals =
		mealFilter && mealFilter.type === 'picker' ? mealFilter.spec.options.length > 1 : false
	const nonPickerFilters = filters.filter((f) => f.type !== 'picker')

	// One view, not a fragment: `RNHostView` measures `children.first.uiView`,
	// so a fragment of two bars sizes to the first and leaves the second in
	// dead space with the SwiftUI host showing through the gap.
	return (
		<View style={styles.bars}>
			<Toolbar>
				<View style={[styles.toolbarSection, styles.today]}>
					<Text style={styles.toolbarText}>{date.format('MMM Do')}</Text>
					{title ? <Text style={styles.toolbarText}> — {title}</Text> : null}
				</View>
				{mealFilter && multipleMeals ? (
					<View style={styles.mealPicker}>
						<FilterToolbarButton<T>
							filter={mealFilter}
							isActive={false}
							onChange={onChange}
							title={mealFilter.spec.title}
						/>
					</View>
				) : null}
			</Toolbar>
			{isOpen && (
				<FilterToolbar<T> filters={nonPickerFilters} iconFor={iconFor} onChange={onChange} />
			)}
		</View>
	)
}
