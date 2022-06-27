import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BaseDateTimePicker} from './basepicker'
import {IosDatetimePickerProps} from './types'

export const DatePicker = (props: IosDatetimePickerProps): JSX.Element => (
	<BaseDateTimePicker
		displayIos={props.displayIos}
		initialDate={props.initialDate}
		minuteInterval={props.minuteInterval}
		mode={props.mode}
		onDateChange={props.onDateChange}
		showPickerIos={true}
		style={[defaultStyle.datePicker, props.style]}
	/>
)

const defaultStyle = StyleSheet.create({
	datePicker: {
		// Fixes the row-styled iOS picker's button's width
		// which initializes to zero
		minWidth: 120,
	},
})
