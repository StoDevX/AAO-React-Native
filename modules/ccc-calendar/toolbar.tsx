import * as React from 'react'

import {CalendarPicker, type CalendarPickerProps} from './calendar-picker'
import {CalendarModePicker, type CalendarModePickerProps} from './mode-picker'

export type CalendarToolbarProps = CalendarPickerProps & CalendarModePickerProps

export type CalendarFilterChipsProps = Omit<CalendarPickerProps, 'onTodayPress'>

/**
 * The calendar's controls: the mode menu at the top right, and Today and the
 * filter menu in the bottom toolbar. `toolbar.android.tsx` puts Today and the
 * mode menu in the top app bar, and the filters in `CalendarFilterChips`.
 */
export function CalendarToolbar({
	mode,
	onSelectMode,
	...picker
}: CalendarToolbarProps): React.ReactNode {
	return (
		<>
			<CalendarModePicker mode={mode} onSelectMode={onSelectMode} />
			<CalendarPicker {...picker} />
		</>
	)
}

/**
 * A row of filter chips above the calendar, on Android. iOS filters from the
 * bottom toolbar's menu, so draws nothing here.
 */
export function CalendarFilterChips(_props: CalendarFilterChipsProps): React.ReactNode {
	return null
}
