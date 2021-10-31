import * as React from 'react'
import {Button, Platform, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import DateTimePicker, {Event} from '@react-native-community/datetimepicker'
import type {
	AndroidNativeProps,
	IOSNativeProps,
} from '@react-native-community/datetimepicker'
import type {AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@frogpond/app-theme'

// TODO: move iOS and Android bits into separate files

type Props = {
	initialDate: Moment
	minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30
	mode: IOSNativeProps['mode'] | AndroidNativeProps['mode']
	format?: string
	theme: AppTheme

	onDateChange: (moment: Moment) => any
}

const FORMATS = {
	date: 'YYYY-MM-DD',
	datetime: 'YYYY-MM-DD HH:mm',
	time: 'HH:mm',
}

const DatePicker = (props: Props): JSX.Element => {
	let [date, setDate] = React.useState(props.initialDate)
	let [timezone] = React.useState(props.initialDate.tz() || '')

	let [showAndroidPicker, setShowAndroidPicker] = React.useState(false)

	const onChange = (event: Event, selectedDate?: Date | undefined) => {
		if (Platform.OS === 'android') {
			false
		}

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

	const BasePicker = () => (
		<DateTimePicker
			minuteInterval={props.minuteInterval}
			mode={props.mode}
			onChange={onChange}
			style={defaultStyle.datePicker}
			testID="buildingHoursTimePicker"
			timeZoneOffsetInMinutes={getTimezoneOffsetInMinutes()}
			value={moment.tz(date, timezone).toDate()}
		/>
	)

	const AndroidDatePicker = (
		<>
			<Button
				color={props.theme.buttonBackground}
				onPress={() => setShowAndroidPicker(true)}
				title={formatDate(date)}
			/>
			{showAndroidPicker && <BasePicker />}
		</>
	)

	return Platform.OS === 'ios' ? <BasePicker /> : AndroidDatePicker
}

const ThemedDatePicker = withTheme(DatePicker)

export {ThemedDatePicker as DatePicker}

const defaultStyle = StyleSheet.create({
	datePicker: {
		// Fixes the row-styled iOS picker's button's width
		// which initializes to zero
		minWidth: 120,
	},
})
