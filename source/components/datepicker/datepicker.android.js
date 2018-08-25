// @flow

import * as React from 'react'
import {
	View,
	Text,
	TouchableHighlight,
	DatePickerAndroid,
	TimePickerAndroid,
	Keyboard,
	StyleSheet,
} from 'react-native'
import moment from 'moment-timezone'
import * as c from '../colors'
import type {StyleSheetRules} from './types'

type Props = {
	androidMode: 'calendar' | 'spinner' | 'default',
	date: moment,
	formattedDate: string,
	mode: 'date' | 'datetime' | 'time',
	onDateChange: moment => any,
	style?: StyleSheetRules,
	timezone: string,
}

type DatePickerResponse = {
	action: string,
	year: number,
	month: number,
	day: number,
}

type TimePickerResponse = {
	action: string,
	hour: number,
	minute: number,
}

export class DatePicker extends React.PureComponent<Props> {
	static defaultProps = {
		mode: 'date',
		androidMode: 'default',
		onDateChange: () => null,
	}

	onDatePicked = ({action, year, month, day}: DatePickerResponse) => {
		if (action === DatePickerAndroid.dismissedAction) {
			return
		}

		this.props.onDateChange(moment.tz({year, month, day}, this.props.timezone))
	}

	onTimePicked = ({action, hour, minute}: TimePickerResponse) => {
		if (action === DatePickerAndroid.dismissedAction) {
			return
		}

		this.props.onDateChange(moment.tz({hour, minute}, this.props.timezone))
	}

	onDatetimeDatePicked = ({action, year, month, day}: DatePickerResponse) => {
		if (action === DatePickerAndroid.dismissedAction) {
			return
		}

		const {androidMode, date} = this.props
		const timeMoment = moment(date)

		TimePickerAndroid.open({
			hour: timeMoment.hour(),
			minute: timeMoment.minutes(),
			mode: androidMode,
		}).then(this.onDatetimeTimePicked(year, month, day))
	}

	onDatetimeTimePicked = (year: number, month: number, day: number) => ({
		action,
		hour,
		minute,
	}: TimePickerResponse) => {
		if (action === DatePickerAndroid.dismissedAction) {
			return
		}

		this.props.onDateChange(
			moment.tz({year, month, day, hour, minute}, this.props.timezone),
		)
	}

	showModal = () => {
		const {mode, androidMode} = this.props

		switch (mode) {
			case 'date': {
				return DatePickerAndroid.open({
					date: this.props.date.toDate(),
					mode: androidMode,
				}).then(this.onDatePicked)
			}

			case 'time': {
				const timeMoment = moment(this.props.date)

				return TimePickerAndroid.open({
					hour: timeMoment.hour(),
					minute: timeMoment.minutes(),
				}).then(this.onTimePicked)
			}

			case 'datetime': {
				return DatePickerAndroid.open({
					date: this.props.date.toDate(),
					mode: androidMode,
				}).then(this.onDatetimeDatePicked)
			}

			default:
				return
		}
	}

	onPressDate = () => {
		Keyboard.dismiss()
		this.showModal()
	}

	render() {
		return (
			<TouchableHighlight
				onPress={this.onPressDate}
				style={defaultStyle.dateTouch}
				underlayColor="transparent"
			>
				<View style={defaultStyle.dateTouchBody}>
					<View style={defaultStyle.dateInput}>
						<Text style={defaultStyle.dateText}>
							{this.props.formattedDate}
						</Text>
					</View>
				</View>
			</TouchableHighlight>
		)
	}
}

/* eslint-disable react-native/no-color-literals */
const defaultStyle = StyleSheet.create({
	dateTouch: {
		flexDirection: 'row',
		width: null,
	},
	dateTouchBody: {
		flexDirection: 'row',
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dateInput: {
		flex: 0,
		borderWidth: 0,
		height: 40,
		borderColor: '#aaa',
		alignItems: 'center',
		justifyContent: 'center',
	},
	dateText: {
		color: c.iosDisabledText,
		fontSize: 16,
	},
})
/* eslint-enable react-native/no-color-literals */
