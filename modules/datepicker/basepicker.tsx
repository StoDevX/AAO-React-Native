import * as React from 'react'

import moment from 'moment-timezone'

import {
	DateTimePicker,
	type DateTimePickerEvent,
} from '@expo/ui/community/datetime-picker'

import {BaseDatetimePickerProps} from './types'

export const BaseDateTimePicker = (
	props: BaseDatetimePickerProps,
): React.ReactNode => {
	let [date, setDate] = React.useState(props.initialDate)
	let [timezone] = React.useState(props.initialDate.tz() || '')

	const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
		props.onChange?.()

		if (!selectedDate) {
			return
		}

		setDate(moment(selectedDate))
		props.onDateChange(moment.tz(selectedDate, timezone))
	}

	let sharedPlatformProps = {
		mode: props.mode,
		onChange: onChange,
		style: props.style,
		testID: 'datepicker',
		// The picker takes an IANA zone name directly, so the wrapper no longer
		// hand-computes an offset and negates moment's POSIX inversion.
		timeZoneName: timezone,
		value: moment.tz(date, timezone).toDate(),
	}

	return (
		<>
			{props.showPickerIos && (
				<DateTimePicker display={props.displayIos} {...sharedPlatformProps} />
			)}
		</>
	)
}
