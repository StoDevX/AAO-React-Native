import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Stack} from 'expo-router'

import {DropdownChip} from '../../source/android-ui/dropdown-chip'
import {filterAfterChoosing} from '../../source/features/calendar/picker-state'
import type {CalendarFilter} from '../../source/features/calendar/store'
import {CalendarModeMenu} from './mode-picker'
import type {CalendarFilterChipsProps, CalendarToolbarProps} from './toolbar'

/**
 * The calendar's app-bar actions on Android: Today, then the overflow menu
 * that picks the view. The filters are a row of chips under the app bar --
 * see `CalendarFilterChips` -- rather than the bottom toolbar iOS uses, which
 * would float a pill over the list.
 *
 * One `Stack.Toolbar` holds both because each `placement="right"` toolbar
 * replaces the screen's `headerRight`; two would leave only the last.
 */
export function CalendarToolbar({
	mode,
	onSelectMode,
	onTodayPress,
}: CalendarToolbarProps): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			{onTodayPress ? (
				<Stack.Toolbar.Button accessibilityLabel="Today" icon="calendar" onPress={onTodayPress} />
			) : null}
			<Stack.Toolbar.View>
				<CalendarModeMenu mode={mode} onSelectMode={onSelectMode} systemName="ellipsis" />
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}

/**
 * The calendar's filters as Material dropdown chips: which calendars
 * contribute, and the category or organization the list is narrowed to. A
 * chip names its choice once one is made, so the filter in effect is on the
 * screen rather than behind a menu. Category and organization share one
 * selection, as on iOS: choosing on one clears the other, and choosing the
 * value already chosen clears it.
 */
export function CalendarFilterChips({
	sources,
	enabledIds,
	onToggleSource,
	categories,
	organizations,
	filter,
	onSelectFilter,
}: CalendarFilterChipsProps): React.ReactNode {
	let axisChip = (
		axis: CalendarFilter['axis'],
		title: string,
		values: CalendarFilterChipsProps['categories'],
	) => (
		<DropdownChip
			key={axis}
			label={filter?.axis === axis ? filter.value : title}
			options={values.map((option) => ({
				key: option.value,
				label: `${option.value} (${option.count})`,
				checked: filter?.axis === axis && filter.value === option.value,
				onSelect: () => onSelectFilter(filterAfterChoosing(filter, axis, option.value)),
			}))}
			selected={filter?.axis === axis}
		/>
	)

	return (
		<ScrollView
			contentContainerStyle={styles.row}
			horizontal={true}
			showsHorizontalScrollIndicator={false}
			style={styles.scroller}
		>
			<DropdownChip
				label="Calendars"
				multiple={true}
				options={sources.map((source) => ({
					key: source.id,
					label: source.title,
					checked: enabledIds.includes(source.id),
					onSelect: () => onToggleSource(source.id),
				}))}
				selected={enabledIds.length < sources.length}
			/>
			{categories.length > 0 ? axisChip('category', 'Category', categories) : null}
			{organizations.length > 0 ? axisChip('organization', 'Organization', organizations) : null}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scroller: {
		flexGrow: 0,
	},
	row: {
		// Material's chip row: 16dp from the screen edge, 8dp between chips.
		paddingHorizontal: 16,
		paddingVertical: 8,
		columnGap: 8,
		alignItems: 'center',
	},
})
