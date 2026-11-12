import * as React from 'react'
import {Stack} from 'expo-router'

import type {CalendarMode} from '../../source/features/calendar/store'

/** An app-bar menu's icon, as `Stack.Toolbar.Menu` takes it. */
export type MenuIcon = React.ComponentProps<typeof Stack.Toolbar.Menu>['icon']

/**
 * The calendar's top-right menu: how the screen draws itself.
 *
 * The entries dismiss the menu on choice, unlike the filter menu's, which is
 * pinned open so several filters can be set in one visit. Choosing a view is
 * one decision, and the menu would otherwise sit over the view it just
 * changed.
 */
export type CalendarModePickerProps = {
	mode: CalendarMode
	onSelectMode: (mode: CalendarMode) => void
}

// Mirrored by `TestIdentifiers.Calendar.modePicker` in the XCUITest target: it
// is the only handle those tests have on this menu.
const LABEL = 'Calendar view'

export function CalendarModePicker(props: CalendarModePickerProps): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">{calendarModeMenu(props, 'ellipsis.circle')}</Stack.Toolbar>
	)
}

/**
 * The mode menu itself, for a toolbar to hold. A function returning the
 * element rather than a component: `Stack.Toolbar` reads its items by their
 * element type, and a component wrapping one hides it.
 */
export function calendarModeMenu(
	{mode, onSelectMode}: CalendarModePickerProps,
	icon: MenuIcon,
): React.ReactElement {
	return (
		<Stack.Toolbar.Menu accessibilityLabel={LABEL} icon={icon}>
			<Stack.Toolbar.MenuAction isOn={mode === 'day'} onPress={() => onSelectMode('day')}>
				Day
			</Stack.Toolbar.MenuAction>
			{/*
			<Stack.Toolbar.MenuAction isOn={mode === 'timeline'} onPress={() => onSelectMode('timeline')}>
				Timeline
			</Stack.Toolbar.MenuAction>
			*/}
			<Stack.Toolbar.MenuAction isOn={mode === 'upcoming'} onPress={() => onSelectMode('upcoming')}>
				Upcoming
			</Stack.Toolbar.MenuAction>
		</Stack.Toolbar.Menu>
	)
}
