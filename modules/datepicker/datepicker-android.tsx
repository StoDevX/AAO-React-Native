import * as React from 'react'

import {BaseDateTimePicker} from './basepicker'
import {AndroidDatetimePickerProps} from './types'

export const DatePicker = (props: AndroidDatetimePickerProps): JSX.Element => {
	// Android's picker button does not initially show
	let showPickerButtonAndroid = true

	// Modal state
	let [showPickerAndroid, setShowPickerAndroid] = React.useState(false)

	const onChange = () => {
		setShowPickerAndroid(false)
	}

	return (
		<BaseDateTimePicker
			displayAndroid={props.displayAndroid}
			format={props.format}
			initialDate={props.initialDate}
			minuteInterval={props.minuteInterval}
			mode={props.mode}
			onChange={onChange}
			onDateChange={props.onDateChange}
			setShowPickerAndroid={setShowPickerAndroid}
			showPickerAndroid={showPickerAndroid}
			showPickerButtonAndroid={showPickerButtonAndroid}
		/>
	)
}
