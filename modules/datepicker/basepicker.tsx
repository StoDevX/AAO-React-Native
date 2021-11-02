import * as React from 'react'
import {Button} from 'react-native'

import {getTheme} from '@frogpond/app-theme'
import type {AppTheme} from '@frogpond/app-theme'

import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'

import DateTimePicker from '@react-native-community/datetimepicker'
import type {Event} from '@react-native-community/datetimepicker'

import {BaseDatetimePickerProps} from './types'

const FORMATS = {
	date: 'YYYY-MM-DD',
	datetime: 'YYYY-MM-DD HH:mm',
	time: 'HH:mm',
}

export const BaseDateTimePicker = (
	props: BaseDatetimePickerProps,
): JSX.Element => {
	let [date, setDate] = React.useState(props.initialDate)
	let [timezone] = React.useState(props.initialDate.tz() || '')

	const onChange = (_event: Event, selectedDate?: Date | undefined) => {
		// Reset Android's modal's presenting state
		props.onChange?.()

		if (!selectedDate) {
			return
		}

		setDate(moment(selectedDate))
		props.onDateChange(moment.tz(selectedDate, timezone))
	}

	const formatDate = (date: Moment): string => {
		const {mode, format = FORMATS[mode]} = props
		return moment.tz(date, timezone).format(format)
	}

	const getTimezoneOffsetInMinutes = (): number => {
		// We need to negate the offset because moment inverts the offset
		// for POSIX compatability. So, GMT-5 (CST) is shown to be GMT+5.
		//
		// We also need to make the types happy when we negate a negative
		// MomentZone which is possibly null.
		let dateInUnixMs = date.valueOf()
		let momentZone = moment.tz.zone(timezone)

		let offset = momentZone ? -momentZone.utcOffset(dateInUnixMs) : 0
		return offset
	}

	let theme: AppTheme = getTheme()

	return (
		<>
			{props.showPickerButtonAndroid && (
				<Button
					color={theme.buttonBackground}
					onPress={() => props.setShowPickerAndroid?.(true)}
					title={formatDate(date)}
					testID='datepicker-button-android'
				/>
			)}

			{(props.showPickerAndroid || props.showPickeriOS) && (
				<DateTimePicker
					minuteInterval={props.minuteInterval}
					mode={props.mode}
					onChange={onChange}
					style={props.style}
					testID='datepicker'
					timeZoneOffsetInMinutes={getTimezoneOffsetInMinutes()}
					value={moment.tz(date, timezone).toDate()}
				/>
			)}
		</>
	)
}
