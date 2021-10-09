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
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'
import type {ViewStyle} from 'react-native'

type AndroidTimeMode = 'clock' | 'spinner' | 'default' | undefined
type AndroidDateMode = 'calendar' | 'spinner' | 'default' | undefined

type Props = {
	androidMode: AndroidTimeMode | AndroidDateMode
	date: Moment
	formattedDate: string
	mode: 'date' | 'datetime' | 'time' | 'calendar' | 'spinner' | 'default'
	onDateChange: (moment: Moment) => any
	style?: ViewStyle
	timezone: string
}

type DatePickerResponse = {
	action: string
	year: number
	month: number
	day: number
}

type TimePickerResponse = {
	action: string
	hour: number
	minute: number
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

		const mode: AndroidTimeMode = androidMode as AndroidTimeMode

		TimePickerAndroid.open({
			hour: timeMoment.hour(),
			minute: timeMoment.minutes(),
			mode,
		}).then(this.onDatetimeTimePicked(year, month, day))
	}

	onDatetimeTimePicked =
		(year: number, month: number, day: number) =>
		({action, hour, minute}: TimePickerResponse) => {
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
				const mode: AndroidDateMode = androidMode as AndroidDateMode

				return DatePickerAndroid.open({
					date: this.props.date.toDate(),
					mode,
				}).then(this.onDatePicked)
			}

			case 'time': {
				const timeMoment = moment(this.props.date)

				const mode: AndroidTimeMode = androidMode as AndroidTimeMode

				return TimePickerAndroid.open({
					hour: timeMoment.hour(),
					minute: timeMoment.minutes(),
					mode,
				}).then(this.onTimePicked)
			}

			case 'datetime': {
				const mode: AndroidDateMode = androidMode as AndroidDateMode

				return DatePickerAndroid.open({
					date: this.props.date.toDate(),
					mode,
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
		width: 0,
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
