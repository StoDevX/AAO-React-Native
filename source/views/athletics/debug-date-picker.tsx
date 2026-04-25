import * as React from 'react'
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

type Props = {
	date: Date
	onDateChange: (date: Date) => void
}

export function DebugDatePicker({date, onDateChange}: Props): React.ReactNode {
	const isDev = useIsDevMode()
	if (!isDev) {
		return null
	}

	const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
		if (selected) {
			onDateChange(selected)
		}
	}

	return (
		<DateTimePicker
			display="compact"
			mode="date"
			onChange={handleChange}
			value={date}
		/>
	)
}
