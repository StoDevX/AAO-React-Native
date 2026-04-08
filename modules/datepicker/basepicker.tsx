import * as React from 'react'

import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'

import {
	DateTimePickerEvent,
	default as DateTimePicker,
} from '@react-native-community/datetimepicker'

import {BaseDatetimePickerProps} from './types'

export const BaseDateTimePicker = (
	props: BaseDatetimePickerProps,
): JSX.Element => {
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

	const getTimezoneOffsetInMinutes = (d: Moment, tz: string): number => {
		// We need to negate the offset because moment inverts the offset
		// for POSIX compatability. So, GMT-5 (CST) is shown to be GMT+5.
		//
		// We also need to make the types happy when we negate a negative
		// MomentZone which is possibly null.
		let dateInUnixMs = d.valueOf()
		let momentZone = moment.tz.zone(tz)

		return momentZone ? -momentZone.utcOffset(dateInUnixMs) : 0
	}

	let sharedPlatformProps = {
		minuteInterval: props.minuteInterval,
		mode: props.mode,
		onChange: onChange,
		style: props.style,
		testID: 'datepicker',
		timeZoneOffsetInMinutes: getTimezoneOffsetInMinutes(date, timezone),
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
