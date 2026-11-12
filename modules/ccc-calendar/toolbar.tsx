import * as React from 'react'

import {CalendarPicker, type CalendarPickerProps} from './calendar-picker'
import {CalendarModePicker, type CalendarModePickerProps} from './mode-picker'

export type CalendarToolbarProps = CalendarPickerProps & CalendarModePickerProps

/**
 * The calendar's controls: the mode menu at the top right, and Today and the
 * filter menu in the bottom toolbar. `toolbar.android.tsx` puts all three in
 * the top app bar instead.
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
