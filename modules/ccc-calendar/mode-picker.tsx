import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Toggle} from '@expo/ui/swift-ui'
import {accessibilityLabel, foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import type {CalendarMode} from '../../source/features/calendar/store'

/**
 * The calendar's top-right menu: how the screen draws itself.
 *
 * Anchored at the top of the screen, so the menu opens downward and SwiftUI
 * draws its entries in the order they are written. `calendar-picker.tsx`
 * documents the opposite for its own children; that inversion belongs to its
 * bottom anchor, not to `Menu`.
 *
 * The entries dismiss the menu on choice, unlike the filter menu's, which is
 * pinned open so several filters can be set in one visit. Choosing a view is
 * one decision, and the menu would otherwise sit over the view it just
 * changed.
 */
type Props = {
	mode: CalendarMode
	onSelectMode: (mode: CalendarMode) => void
}

// Mirrored by `TestIdentifiers.Calendar.modePicker` in the XCUITest target: it
// is the only handle those tests have on this menu.
const LABEL = accessibilityLabel('Calendar view')
const MENU_MODIFIERS = [LABEL, foregroundStyle(c.label)]

export function CalendarModePicker({mode, onSelectMode}: Props): React.ReactNode {
	return (
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="ellipsis.circle" />} modifiers={MENU_MODIFIERS}>
						<Toggle isOn={mode === 'day'} label="Day" onIsOnChange={() => onSelectMode('day')} />
						{/*
						<Toggle
							isOn={mode === 'timeline'}
							label="Timeline"
							onIsOnChange={() => onSelectMode('timeline')}
						/>
						*/}
						<Toggle
							isOn={mode === 'upcoming'}
							label="Upcoming"
							onIsOnChange={() => onSelectMode('upcoming')}
						/>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
