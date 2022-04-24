/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import * as React from 'react'
import {useCallback, useState} from 'react'
import xor from 'lodash/xor'
import {Platform, ScrollView, StyleSheet, Text} from 'react-native'
import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'
import {Cell, DeleteButtonCell, Section, TableView} from '@frogpond/tableview'
import type {DayOfWeekEnumType, SingleBuildingScheduleType} from '../types'
import {Row} from '@frogpond/layout'
import type {TopLevelViewPropsType} from '../../types'
import {blankSchedule, parseHours} from '../lib'
import * as c from '@frogpond/colors'
import {sto} from '../../../lib/colors'
import {DatePicker} from '@frogpond/datepicker'
import {Touchable} from '@frogpond/touchable'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export type RouteParams = {
	set: SingleBuildingScheduleType | undefined
	onEditSet: (set: SingleBuildingScheduleType) => unknown
	onDeleteSet: () => unknown
}

type Props = TopLevelViewPropsType & {
	route: {params: RouteParams}
}

export function BuildingHoursScheduleEditorView(props: Props): JSX.Element {
	let [set, setSet] = useState<SingleBuildingScheduleType>(
		props.route.params.set ?? blankSchedule(),
	)

	let deleteSet = () => {
		props.route.params.onDeleteSet()
		props.navigation.goBack()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		setSet(newSet)
		props.route.params.onEditSet(newSet)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		setSet(newSet)
		props.route.params.onEditSet(newSet)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		setSet(newSet)
		props.route.params.onEditSet(newSet)
	}

	let {open, close} = parseHours(set, moment())

	return (
		<ScrollView>
			<TableView>
				<Section>
					<WeekToggles days={set.days} onChangeDays={onChangeDays} />
					<DatePickerCell date={open} onChange={onChangeOpen} title="Open" />
					<DatePickerCell date={close} onChange={onChangeClose} title="Close" />
				</Section>

				<Section>
					<DeleteButtonCell onPress={deleteSet} title="Remove" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[]
	onChangeDays: (days: DayOfWeekEnumType[]) => unknown
}

function WeekToggles(props: WeekTogglesProps) {
	let {onChangeDays, days} = props

	let toggleDay = useCallback(
		(day) => {
			onChangeDays(xor(days, [day]))
		},
		[onChangeDays, days],
	)

	let allDays: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<Row
			style={
				Platform.OS === 'ios'
					? styles.iOSweekToggles
					: styles.androidWeekToggles
			}
		>
			{allDays.map((day) => (
				<ToggleButton
					key={day}
					active={props.days.includes(day)}
					onPress={toggleDay}
					text={day}
				/>
			))}
		</Row>
	)
}

type ToggleButtonProps = {
	active: boolean
	text: DayOfWeekEnumType
	onPress: (newState: DayOfWeekEnumType) => unknown
}

class ToggleButton extends React.PureComponent<ToggleButtonProps> {
	onPress = () => this.props.onPress(this.props.text)

	platformStyle = Platform.select({
		ios: styles.iOSDayWrapper,
		android: styles.androidDayWrapper,
	})

	platformActiveStyle = Platform.select({
		ios: styles.iOSDayActive,
		android: styles.androidDayActive,
	})

	render() {
		let {text, active} = this.props
		return (
			<Touchable
				containerStyle={[
					this.platformStyle,
					active && this.platformActiveStyle,
				]}
				highlight={false}
				onPress={this.onPress}
			>
				<Text style={[styles.dayText, active && styles.activeDayText]}>
					{text}
				</Text>
			</Touchable>
		)
	}
}

type DatePickerCellProps = {
	date: Moment
	title: string
	onChange: (date: Moment) => unknown
}

function DatePickerCell(props: DatePickerCellProps) {
	let format = 'h:mm A'

	let accessory = (
		<DatePicker
			format={format}
			initialDate={props.date}
			minuteInterval={5}
			mode="time"
			onDateChange={(newDate: Moment) => {
				let oldMoment = moment()

				oldMoment.hours(newDate.hours())
				oldMoment.minutes(newDate.minutes())

				props.onChange(oldMoment)
			}}
		/>
	)

	return (
		<Cell
			cellAccessoryView={accessory}
			cellStyle="RightDetail"
			title={props.title}
		/>
	)
}

const styles = StyleSheet.create({
	iOSweekToggles: {
		alignItems: 'stretch',
		justifyContent: 'center',
		backgroundColor: c.white,
		paddingHorizontal: 10,
		paddingVertical: 20,
	},
	androidWeekToggles: {
		alignItems: 'stretch',
		justifyContent: 'center',
		backgroundColor: c.white,
		paddingHorizontal: 10,
		paddingVertical: 20,
	},
	iOSDayWrapper: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 20,
		margin: 5,
		backgroundColor: c.iosGray,
	},
	androidDayWrapper: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderColor: c.androidSeparator,
		borderRadius: 20,
		borderWidth: 1,
		margin: 5,
		backgroundColor: c.white,
	},
	androidDayActive: {
		backgroundColor: sto.purple,
		borderColor: c.transparent,
	},
	iOSDayActive: {
		backgroundColor: c.infoBlue,
	},
	dayText: {
		fontSize: 16,
	},
	activeDayText: {
		color: c.white,
	},
})

export const NavigationKey = 'BuildingHoursProblemReportEditor'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Edit Schedule',
}
