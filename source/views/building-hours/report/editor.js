/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import * as React from 'react'
import xor from 'lodash/xor'
import {View, ScrollView, Platform, Text, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import {
	TableView,
	Section,
	Cell,
	DeleteButtonCell,
	CellToggle,
} from '@frogpond/tableview'
import type {SingleBuildingScheduleType, DayOfWeekEnumType} from '../types'
import {Row} from '@frogpond/layout'
import type {TopLevelViewPropsType} from '../../types'
import {parseHours, blankSchedule} from '../lib'
import * as c from '@frogpond/colors'
import {DatePicker} from '@frogpond/datepicker'
import {Touchable} from '@frogpond/touchable'
import {ListSeparator} from '@frogpond/lists'

type Props = TopLevelViewPropsType & {
	navigation: {
		state: {
			params: {
				set: SingleBuildingScheduleType,
				onEditSet: (set: SingleBuildingScheduleType) => any,
				onDeleteSet: () => any,
			},
		},
	},
}

export function BuildingHoursScheduleEditorView(props: Props) {
	let {goBack} = props.navigation
	let {onDeleteSet, onEditSet} = props.navigation.state.params

	let [set, updateSet] = React.useState(
		props.navigation.state.params.initialSet || blankSchedule(),
	)

	let remove = () => {
		onDeleteSet()
		goBack()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		updateSet(newSet)
		onEditSet(newSet)
	}

	let onChangeOpen = (newDate: moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		updateSet(newSet)
		onEditSet(newSet)
	}

	let onChangeClose = (newDate: moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		updateSet(newSet)
		onEditSet(newSet)
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
					<DeleteButtonCell onPress={remove} title="Delete Hours" />
				</Section>
			</TableView>
		</ScrollView>
	)
}
BuildingHoursScheduleEditorView.navigationOptions = {
	title: 'Edit Schedule',
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[],
	onChangeDays: (DayOfWeekEnumType[]) => any,
}

function WeekTogglesIOS(props: WeekTogglesProps) {
	let toggleDay = (day: DayOfWeekEnumType) => {
		props.onChangeDays(xor(props.days, [day]))
	}

	let allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<Row alignItems="stretch" justifyContent="center">
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
	let toggleDay = (day) => {
		props.onChangeDays(xor(props.days, [day]))
	}

	let allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<View>
			{allDays.map((day, i) => (
				<View key={day}>
					<CellToggle
						key={day}
						label={day}
						onChange={() => toggleDay(day)}
						value={props.days.includes(day)}
					/>
					{i === allDays.length - 1 ? null : <ListSeparator force={true} />}
				</View>
			))}
		</View>
	)
}

type ToggleButtonProps = {
	active: boolean,
	text: DayOfWeekEnumType,
	onPress: (newState: DayOfWeekEnumType) => any,
}

function ToggleButton(props: ToggleButtonProps) {
	let {text, active} = props
	return (
		<Touchable
			containerStyle={[styles.dayWrapper, active && styles.activeDay]}
			highlight={false}
			onPress={() => props.onPress(this.props.text)}
		>
			<Text style={[styles.dayText, active && styles.activeDayText]}>
				{text}
			</Text>
		</Touchable>
	)
}

const WeekToggles = Platform.OS === 'ios' ? WeekTogglesIOS : WeekTogglesAndroid

type DatePickerCellProps = {
	date: moment,
	title: string,
	onChange: (date: moment) => any,
}

class DatePickerCell extends React.PureComponent<DatePickerCellProps> {
	_picker: any
	openPicker = () => this._picker.onPressDate()

	getRef = (ref: any) => (this._picker = ref)

	onChange = (newDate: moment) => {
		let oldMoment = moment()

		oldMoment.hours(newDate.hours())
		oldMoment.minutes(newDate.minutes())

		this.props.onChange(oldMoment)
	}

	render() {
		let format = 'h:mm A'

		let accessory = (
			<DatePicker
				ref={this.getRef}
				format={format}
				initialDate={this.props.date}
				minuteInterval={5}
				mode="time"
				onDateChange={this.onChange}
			/>
		)

		return (
			<Cell
				cellAccessoryView={accessory}
				cellStyle="RightDetail"
				onPress={this.openPicker}
				title={this.props.title}
			/>
		)
	}
}

const styles = StyleSheet.create({
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
