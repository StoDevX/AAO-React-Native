import * as React from 'react'
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

type Props = {
	initialDate?: Date
	onDateChange: (date: Date) => void
}

export function DebugDatePicker({
	initialDate,
	onDateChange,
}: Props): React.ReactNode {
	const isDev = useIsDevMode()
	const [value, setValue] = React.useState(initialDate ?? new Date())

	if (!isDev) {
		return null
	}

	const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
		if (selected) {
			setValue(selected)
			onDateChange(selected)
		}
	}

	return (
		<DateTimePicker
			display="compact"
			mode="date"
			onChange={handleChange}
			value={value}
		/>
	)
}
