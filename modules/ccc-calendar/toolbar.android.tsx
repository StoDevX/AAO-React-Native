import * as React from 'react'
import {Stack} from 'expo-router'

import {CalendarFilterMenu} from './calendar-picker'
import {CalendarModeMenu} from './mode-picker'
import type {CalendarToolbarProps} from './toolbar'

/**
 * The calendar's controls on Android, all in the top app bar, as Android's
 * calendars place them: Today, then the filter, then the overflow menu that
 * picks the view. The bottom toolbar iOS uses would float a pill over the
 * list, which is no Android control.
 *
 * One `Stack.Toolbar` holds all three because each `placement="right"`
 * toolbar replaces the screen's `headerRight`; two would leave only the last.
 */
export function CalendarToolbar({
	mode,
	onSelectMode,
	onTodayPress,
	...filter
}: CalendarToolbarProps): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			{onTodayPress ? (
				<Stack.Toolbar.Button accessibilityLabel="Today" icon="calendar" onPress={onTodayPress} />
			) : null}
			<Stack.Toolbar.View>
				<CalendarFilterMenu {...filter} systemName="line.3.horizontal.decrease" />
			</Stack.Toolbar.View>
			<Stack.Toolbar.View>
				<CalendarModeMenu mode={mode} onSelectMode={onSelectMode} systemName="ellipsis" />
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
