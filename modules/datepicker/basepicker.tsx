import * as React from 'react'

import {
	DateTimePickerEvent,
	default as DateTimePicker,
} from '@react-native-community/datetimepicker'

import {
	fromDate,
	toDate,
	getTimezoneOffsetMinutes,
} from '../../source/lib/temporal'
import {BaseDatetimePickerProps} from './types'

export const BaseDateTimePicker = (
	props: BaseDatetimePickerProps,
): JSX.Element => {
	let [date, setDate] = React.useState(props.initialDate)
	let tz = props.initialDate.timeZoneId

	const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
		props.onChange?.()

		if (!selectedDate) {
			return
		}

		let newDate = fromDate(selectedDate, tz)
		setDate(newDate)
		props.onDateChange(newDate)
	}

	let sharedPlatformProps = {
		minuteInterval: props.minuteInterval,
		mode: props.mode,
		onChange: onChange,
		style: props.style,
		testID: 'datepicker',
		timeZoneOffsetInMinutes: getTimezoneOffsetMinutes(date),
		value: toDate(date),
	}

	return (
		<>
			{props.showPickerIos && (
				<DateTimePicker display={props.displayIos} {...sharedPlatformProps} />
			)}
		</>
	)
}
