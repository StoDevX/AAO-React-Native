import * as React from 'react'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import type {CalendarFilterOption} from '../../source/features/calendar/filter'
import {axisLabel, filterAfterChoosing} from '../../source/features/calendar/picker-state'
import type {CalendarFilter} from '../../source/features/calendar/store'
import type {CalendarSource} from './sources'
import calendarTodayIcon from '@expo/material-symbols/calendar_today.xml'

/**
 * The calendar's bottom-toolbar menu: which calendars contribute events, and
 * what the list is narrowed to. Category and organisation are one selection
 * between them, not one each -- see `CalendarFilter`.
 *
 * Every entry keeps the menu up (`unstable_keepPresented`), so several
 * filters can be set in one visit. The menu is tinted while it narrows the
 * list. Android draws these filters as chips instead (`toolbar.android.tsx`).
 */
export type CalendarPickerProps = {
	sources: CalendarSource[]
	enabledIds: string[]
	onToggleSource: (id: string) => void
	categories: CalendarFilterOption[]
	organizations: CalendarFilterOption[]
	filter: CalendarFilter | null
	onSelectFilter: (filter: CalendarFilter | null) => void
	onTodayPress?: () => void
}

// Mirrored by `TestIdentifiers.Calendar.picker` in the XCUITest target: it is
// the only handle those tests have on the toolbar menu.
const LABEL = 'Calendar filter'

export function CalendarPicker({
	sources,
	enabledIds,
	onToggleSource,
	categories,
	organizations,
	filter,
	onSelectFilter,
	onTodayPress,
}: CalendarPickerProps): React.ReactNode {
	let toggleFilter = (axis: CalendarFilter['axis'], value: string) => {
		onSelectFilter(filterAfterChoosing(filter, axis, value))
	}

	return (
		<Stack.Toolbar placement="bottom">
			{onTodayPress ? (
				<Stack.Toolbar.Button accessibilityLabel="Today" onPress={onTodayPress}>
					Today
				</Stack.Toolbar.Button>
			) : null}
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.Menu
				accessibilityLabel={LABEL}
				icon={process.env.EXPO_OS === 'ios' ? 'calendar' : calendarTodayIcon}
				tintColor={filter !== null ? c.systemBlue : undefined}
			>
				<Stack.Toolbar.Menu inline={true} title="Calendars">
					{sources.map((source) => (
						<Stack.Toolbar.MenuAction
							key={source.id}
							isOn={enabledIds.includes(source.id)}
							onPress={() => onToggleSource(source.id)}
							unstable_keepPresented={true}
						>
							{source.title}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
				<Stack.Toolbar.Menu title={axisLabel('category', 'Category', filter)}>
					{categories.map((category) => (
						<Stack.Toolbar.MenuAction
							key={category.value}
							isOn={filter?.axis === 'category' && filter.value === category.value}
							onPress={() => toggleFilter('category', category.value)}
							unstable_keepPresented={true}
						>
							{`${category.value} (${category.count})`}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
				{organizations.length > 0 ? (
					<Stack.Toolbar.Menu title={axisLabel('organization', 'Organization', filter)}>
						{organizations.map((organization) => (
							<Stack.Toolbar.MenuAction
								key={organization.value}
								isOn={filter?.axis === 'organization' && filter.value === organization.value}
								onPress={() => toggleFilter('organization', organization.value)}
								unstable_keepPresented={true}
							>
								{`${organization.value} (${organization.count})`}
							</Stack.Toolbar.MenuAction>
						))}
					</Stack.Toolbar.Menu>
				) : null}
				{filter ? (
					<Stack.Toolbar.Menu inline={true}>
						<Stack.Toolbar.MenuAction onPress={() => onSelectFilter(null)}>
							Reset Filters
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
				) : null}
			</Stack.Toolbar.Menu>
		</Stack.Toolbar>
	)
}
