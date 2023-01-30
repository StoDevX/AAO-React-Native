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
import {Cell, Section, TableView} from '@frogpond/tableview'
import {DeleteButtonCell} from '@frogpond/tableview/cells'
import type {DayOfWeekEnumType, SingleBuildingScheduleType} from '../types'
import {Row} from '@frogpond/layout'
import {blankSchedule, parseHours, summarizeDaysAndHours} from '../lib'
import * as c from '@frogpond/colors'
import {sto} from '../../../lib/colors'
import {DatePicker} from '@frogpond/datepicker'
import {Touchable} from '@frogpond/touchable'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

export type RouteParams = {
	set: SingleBuildingScheduleType | undefined
	onEditSet: (set: SingleBuildingScheduleType) => unknown
	onDeleteSet: () => unknown
}

export function BuildingHoursScheduleEditorView(): JSX.Element {
	let navigation = useNavigation()

	let route =
		useRoute<RouteProp<RootStackParamList, 'BuildingHoursScheduleEditor'>>()
	let {params} = route

	let [set, setSet] = useState<SingleBuildingScheduleType>(
		params.set ?? blankSchedule(),
	)

	let deleteSet = () => {
		params.onDeleteSet()
		navigation.goBack()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		setSet(newSet)
		params.onEditSet(newSet)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		setSet(newSet)
		params.onEditSet(newSet)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		setSet(newSet)
		params.onEditSet(newSet)
	}

	let {open, close} = parseHours(set, moment())

	let [summary, setSummary] = React.useState('')

	let buildSummary = React.useCallback(
		(schedule: SingleBuildingScheduleType): string => {
			if (!schedule.days.length) {
				return 'Select a day to get started.'
			}

			return summarizeDaysAndHours(schedule)
		},
		[],
	)

	React.useEffect(() => {
		setSummary(buildSummary(set))
	}, [buildSummary, set])

	return (
		<ScrollView>
			<TableView>
				<Section footer={summary}>
					<WeekToggles days={set.days} onChangeDays={onChangeDays} />
					<Cell
						cellAccessoryView={
							<Row style={styles.datePickerGroup}>
								<DatePickerAccessory date={open} onChange={onChangeOpen} />
								<Text style={styles.datePickerDash}>—</Text>
								<DatePickerAccessory date={close} onChange={onChangeClose} />
							</Row>
						}
						title="Hours"
					/>
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
		(day: DayOfWeekEnumType) => {
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

const ToggleButton = (props: ToggleButtonProps) => {
	let onPress = () => props.onPress(props.text)

	let platformStyle = Platform.select({
		ios: styles.iOSDayWrapper,
		android: styles.androidDayWrapper,
	})

	let platformActiveStyle = Platform.select({
		ios: styles.iOSDayActive,
		android: styles.androidDayActive,
	})

	let {text, active} = props

	return (
		<Touchable
			containerStyle={[platformStyle, active && platformActiveStyle]}
			highlight={false}
			onPress={onPress}
		>
			<Text style={[styles.dayText, active && styles.activeDayText]}>
				{text}
			</Text>
		</Touchable>
	)
}

type DatePickerAccessoryProps = {
	date: Moment
	onChange: (date: Moment) => unknown
}

function DatePickerAccessory(props: DatePickerAccessoryProps) {
	let format = 'h:mm A'
	return (
		<DatePicker
			displayAndroid="clock"
			displayIos="inline"
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
			style={styles.datePicker}
		/>
	)
}

const styles = StyleSheet.create({
	iOSweekToggles: {
		alignItems: 'stretch',
		justifyContent: 'center',
		backgroundColor: c.secondarySystemGroupedBackground,
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
		backgroundColor: c.tertiarySystemGroupedBackground,
	},
	androidDayWrapper: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderColor: c.separator,
		borderRadius: 20,
		borderWidth: 1,
		margin: 5,
		backgroundColor: c.tertiarySystemGroupedBackground,
	},
	androidDayActive: {
		backgroundColor: c.link,
		borderColor: c.transparent,
	},
	iOSDayActive: {
		backgroundColor: c.link,
	},
	dayText: {
		fontSize: 16,
	},
	activeDayText: {
		color: c.white,
	},
	datePickerGroup: {
		alignItems: 'center',
	},
	datePicker: {
		minWidth: 110,
	},
	datePickerDash: {
		color: c.secondaryLabel,
		fontWeight: 'bold',
		marginHorizontal: 2,
	},
})

export const NavigationKey = 'BuildingHoursProblemReportEditor'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Edit Schedule',
	presentation: 'modal',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}
