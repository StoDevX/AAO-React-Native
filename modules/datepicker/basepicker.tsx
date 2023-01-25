import * as React from 'react'
import {Button} from 'react-native'
import {useTheme} from '@frogpond/app-theme'

import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'

import {
	DateTimePickerEvent,
	default as DateTimePicker,
} from '@react-native-community/datetimepicker'

import {BaseDatetimePickerProps} from './types'

const FORMATS = {
	date: 'YYYY-MM-DD',
	datetime: 'YYYY-MM-DD HH:mm',
	time: 'HH:mm',
	countdown: 'HH:mm',
}

export const BaseDateTimePicker = (
	props: BaseDatetimePickerProps,
): JSX.Element => {
	let [date, setDate] = React.useState(props.initialDate)
	let [timezone] = React.useState(props.initialDate.tz() || '')

	const onChange = (
		_event: DateTimePickerEvent,
		selectedDate?: Date | undefined,
	) => {
		// Reset Android's modal's presenting state
		props.onChange?.()

		if (!selectedDate) {
			return
		}

		setDate(moment(selectedDate))
		props.onDateChange(moment.tz(selectedDate, timezone))
	}

	const formatDate = (d: Moment, tz: string): string => {
		const {mode, format = FORMATS[mode]} = props
		return moment.tz(d, tz).format(format)
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

	const { colors } = useTheme();

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
			{props.showPickerButtonAndroid && (
				<Button
					color={colors.background}
					onPress={() => props.setShowPickerAndroid?.(true)}
					testID="datepicker-button-android"
					title={formatDate(date, timezone)}
				/>
			)}

			{props.showPickerAndroid && (
				<DateTimePicker
					display={props.displayAndroid}
					{...sharedPlatformProps}
				/>
			)}

			{props.showPickerIos && (
				<DateTimePicker display={props.displayIos} {...sharedPlatformProps} />
			)}
		</>
	)
}
