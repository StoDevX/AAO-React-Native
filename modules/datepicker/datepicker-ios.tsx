import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BaseDateTimePicker} from './basepicker'
import {IosDatetimePickerProps} from './types'

export const DatePicker = (props: IosDatetimePickerProps): JSX.Element => {
	// Picker + Button needs to always show on iOS
	let showPickeriOS = true

	return (
		<BaseDateTimePicker
			initialDate={props.initialDate}
			minuteInterval={props.minuteInterval}
			mode={props.mode}
			onDateChange={props.onDateChange}
			showPickerIos={showPickeriOS}
			style={defaultStyle.datePicker}
		/>
	)
}

const defaultStyle = StyleSheet.create({
	datePicker: {
		// Fixes the row-styled iOS picker's button's width
		// which initializes to zero
		minWidth: 120,
	},
})
