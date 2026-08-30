import * as React from 'react'

import moment from 'moment-timezone'

import {DateTimePicker, type DateTimePickerChangeEvent} from '@expo/ui/community/datetime-picker'

import {BaseDatetimePickerProps} from './types'

export const BaseDateTimePicker = (props: BaseDatetimePickerProps): React.ReactNode => {
	let [date, setDate] = React.useState(props.initialDate)
	let [timezone] = React.useState(props.initialDate.tz() || '')

	// `onValueChange` fires only on selection and always carries a date, where
	// the `onChange` it replaces also fired on dismissal with none. Only the
	// iOS picker is rendered below, and iOS never dismisses, so the two
	// behave alike here.
	const onValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
		props.onChange?.()

		setDate(moment(selectedDate))
		props.onDateChange(moment.tz(selectedDate, timezone))
	}

	let sharedPlatformProps = {
		mode: props.mode,
		onValueChange: onValueChange,
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
