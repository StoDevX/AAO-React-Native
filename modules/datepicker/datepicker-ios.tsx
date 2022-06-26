import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BaseDateTimePicker} from './basepicker'
import {IosDatetimePickerProps} from './types'

export const DatePicker = (props: IosDatetimePickerProps): JSX.Element => {
	/**
	 * Allows us to override the iOS picker's button's minwidth
	 * which is set below to 120 to accomodate the hours report
	 * editor which changes minwidth to create a compact look.
	 */
	let baseStyle = {
		...defaultStyle.datePicker,
		...props.style,
	}

	return (
		<BaseDateTimePicker
			displayIos={props.displayIos}
			initialDate={props.initialDate}
			minuteInterval={props.minuteInterval}
			mode={props.mode}
			onDateChange={props.onDateChange}
			showPickerIos={true}
			style={baseStyle}
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
