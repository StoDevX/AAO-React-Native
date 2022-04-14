/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import * as React from 'react'
import xor from 'lodash/xor'
import {View, ScrollView, Platform, Text, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
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
				set: SingleBuildingScheduleType
				onEditSet: (set: SingleBuildingScheduleType) => any
				onDeleteSet: () => any
			}
		}
	}
}

type State = {
	set?: SingleBuildingScheduleType
}

export class BuildingHoursScheduleEditorView extends React.PureComponent<
	Props,
	State
> {
	static navigationOptions = {
		title: 'Edit Schedule',
	}

	state = {
		set: this.props.navigation.state.params.initialSet,
	}

	delete = () => {
		this.props.navigation.state.params.onDeleteSet()
		this.props.navigation.goBack()
	}

	onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		this.setState(
			(state) => ({...state, set: {...state.set, days: newDays}}),
			() => this.props.navigation.state.params.onEditSet(this.state.set),
		)
	}

	onChangeOpen = (newDate: Moment) => {
		this.setState(
			(state) => ({
				...state,
				set: {...state.set, from: newDate.format('h:mma')},
			}),
			() => this.props.navigation.state.params.onEditSet(this.state.set),
		)
	}

	onChangeClose = (newDate: Moment) => {
		this.setState(
			(state) => ({...state, set: {...state.set, to: newDate.format('h:mma')}}),
			() => this.props.navigation.state.params.onEditSet(this.state.set),
		)
	}

	render() {
		let set = this.state.set || blankSchedule()

		let {open, close} = parseHours(set, moment())

		return (
			<ScrollView>
				<TableView>
					<Section header="DAYS">
						<WeekToggles days={set.days} onChangeDays={this.onChangeDays} />
					</Section>

					<Section header="TIMES">
						<DatePickerCell
							date={open}
							onChange={this.onChangeOpen}
							title="Open"
						/>
						<DatePickerCell
							date={close}
							onChange={this.onChangeClose}
							title="Close"
						/>
					</Section>

					<Section>
						<DeleteButtonCell onPress={this.delete} title="Delete Hours" />
					</Section>
				</TableView>
			</ScrollView>
		)
	}
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[]
	onChangeDays: (days: DayOfWeekEnumType[]) => any
}

class WeekTogglesIOS extends React.PureComponent<WeekTogglesProps> {
	toggleDay = (day: DayOfWeekEnumType) => {
		this.props.onChangeDays(xor(this.props.days, [day]))
	}

	render() {
		let allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

		return (
			<Row alignItems="stretch" justifyContent="center">
				{allDays.map((day) => (
					<ToggleButton
						key={day}
						active={this.props.days.includes(day)}
						onPress={this.toggleDay}
						text={day}
					/>
				))}
			</Row>
		)
	}
}

class WeekTogglesAndroid extends React.PureComponent<WeekTogglesProps> {
	toggleDay = (day) => {
		this.props.onChangeDays(xor(this.props.days, [day]))
	}

	render() {
		let allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

		return (
			<View>
				{allDays.map((day, i) => (
					<View key={day}>
						<CellToggle
							key={day}
							label={day}
							onChange={() => this.toggleDay(day)}
							value={this.props.days.includes(day)}
						/>
						{i === allDays.length - 1 ? null : <ListSeparator force={true} />}
					</View>
				))}
			</View>
		)
	}
}

type ToggleButtonProps = {
	active: boolean
	text: DayOfWeekEnumType
	onPress: (newState: DayOfWeekEnumType) => any
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
	onChange: (date: Moment) => any
}

class DatePickerCell extends React.PureComponent<DatePickerCellProps> {
	onChange = (newDate: Moment) => {
		let oldMoment = moment()

		oldMoment.hours(newDate.hours())
		oldMoment.minutes(newDate.minutes())

		this.props.onChange(oldMoment)
	}

	render() {
		let format = 'h:mm A'

		let accessory = (
			<DatePicker
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
