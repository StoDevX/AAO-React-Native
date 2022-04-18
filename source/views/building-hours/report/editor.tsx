/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import * as React from 'react'
import {useCallback, useState} from 'react'
import xor from 'lodash/xor'
import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native'
import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'
import {
	Cell,
	CellToggle,
	DeleteButtonCell,
	Section,
	TableView,
} from '@frogpond/tableview'
import type {DayOfWeekEnumType, SingleBuildingScheduleType} from '../types'
import {Row} from '@frogpond/layout'
import type {TopLevelViewPropsType} from '../../types'
import {blankSchedule, parseHours} from '../lib'
import * as c from '@frogpond/colors'
import {DatePicker} from '@frogpond/datepicker'
import {Touchable} from '@frogpond/touchable'
import {ListSeparator} from '@frogpond/lists'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Props = TopLevelViewPropsType & {
	route: {
		params: {
			initialSet: SingleBuildingScheduleType
			set: SingleBuildingScheduleType
			onEditSet: (set: SingleBuildingScheduleType) => unknown
			onDeleteSet: () => unknown
		}
	}
}

export function BuildingHoursScheduleEditorView(props: Props): JSX.Element {
	let [set, setSet] = useState<SingleBuildingScheduleType>(
		props.route.params.initialSet || blankSchedule(),
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
				<Section header="DAYS">
					<WeekToggles days={set.days} onChangeDays={onChangeDays} />
				</Section>

				<Section header="TIMES">
					<DatePickerCell date={open} onChange={onChangeOpen} title="Open" />
					<DatePickerCell date={close} onChange={onChangeClose} title="Close" />
				</Section>

				<Section>
					<DeleteButtonCell onPress={deleteSet} title="Delete Hours" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[]
	onChangeDays: (days: DayOfWeekEnumType[]) => unknown
}

function WeekTogglesIOS(props: WeekTogglesProps) {
	let {onChangeDays, days} = props

	let toggleDay = useCallback(
		(day) => {
			onChangeDays(xor(days, [day]))
		},
		[onChangeDays, days],
	)

	let allDays: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<Row style={styles.weekToggles}>
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

function WeekTogglesAndroid(props: WeekTogglesProps) {
	let {onChangeDays, days} = props

	let toggleDay = useCallback(
		(day) => {
			onChangeDays(xor(days, [day]))
		},
		[onChangeDays, days],
	)

	let allDays: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<View>
			{allDays.map((day, i) => (
				<View key={day}>
					<CellToggle
						key={day}
						label={day}
						onChange={() => toggleDay(day)}
						value={days.includes(day)}
					/>
					{i === allDays.length - 1 ? null : <ListSeparator force={true} />}
				</View>
			))}
		</View>
	)
}

type ToggleButtonProps = {
	active: boolean
	text: DayOfWeekEnumType
	onPress: (newState: DayOfWeekEnumType) => unknown
}

class ToggleButton extends React.PureComponent<ToggleButtonProps> {
	onPress = () => this.props.onPress(this.props.text)

	render() {
		let {text, active} = this.props
		return (
			<Touchable
				containerStyle={[styles.dayWrapper, active && styles.activeDay]}
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

const WeekToggles = Platform.OS === 'ios' ? WeekTogglesIOS : WeekTogglesAndroid

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
	weekToggles: {
		alignItems: 'stretch',
		justifyContent: 'center',
	},
	dayWrapper: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 2,
		backgroundColor: c.white,
	},
	activeDay: {
		backgroundColor: c.brickRed,
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
