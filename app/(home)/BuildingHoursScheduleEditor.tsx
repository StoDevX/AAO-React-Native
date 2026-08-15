import * as React from 'react'
import {useCallback} from 'react'
import xor from 'lodash/xor'
import {ScrollView, StyleSheet, Text} from 'react-native'
import type {Moment} from 'moment-timezone'
import moment from 'moment-timezone'
import {Stack, useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {Cell, Section, TableView} from '@frogpond/tableview'
import {DeleteButtonCell} from '@frogpond/tableview/cells'
import type {DayOfWeekEnumType} from '../../source/features/building-hours/types'
import {Row} from '@frogpond/layout'
import {
	blankSchedule,
	parseHours,
	summarizeDaysAndHours,
} from '../../source/features/building-hours/lib'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {DatePicker} from '@frogpond/datepicker'
import {Touchable} from '@frogpond/touchable'
import {
	applyBuildingAction,
	selectReportDraft,
	useAppDispatch,
	useAppSelector,
} from '../../source/redux'

export default function BuildingHoursScheduleEditorPage(): React.ReactNode {
	const navigation = useNavigation()
	let {scheduleIndex: scheduleIndexParam, setIndex: setIndexParam} = useLocalSearchParams<{
		scheduleIndex: string
		setIndex: string
	}>()
	let scheduleIndex = Number(scheduleIndexParam)
	let setIndex = Number(setIndexParam)

	let router = useRouter()
	let dispatch = useAppDispatch()

	let draft = useAppSelector(selectReportDraft)
	let set = draft?.schedule[scheduleIndex]?.hours[setIndex] ?? blankSchedule()

	let deleteSet = () => {
		dispatch(applyBuildingAction({type: 'DELETE_HOURS', scheduleIndex, setIndex}))
		router.back()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...set, days: newDays}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...set, from: newDate.format('h:mma')}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...set, to: newDate.format('h:mma')}
		dispatch(
			applyBuildingAction({
				type: 'SET_HOURS',
				scheduleIndex,
				setIndex,
				data: newSet,
			}),
		)
	}

	let {open, close} = parseHours(set, moment.tz(timezone()))

	let summary = React.useMemo(() => {
		if (!set.days.length) {
			return 'Select a day to get started.'
		}
		return summarizeDaysAndHours(set)
	}, [set])

	return (
		<>
			<Stack.Title>Edit Schedule</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<ScrollView contentInsetAdjustmentBehavior="automatic">
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
		</>
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
		<Row style={styles.iOSweekToggles}>
			{allDays.map((day) => (
				<ToggleButton key={day} active={props.days.includes(day)} onPress={toggleDay} text={day} />
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

	let platformStyle = styles.iOSDayWrapper

	let platformActiveStyle = styles.iOSDayActive

	let {text, active} = props

	return (
		<Touchable
			containerStyle={[platformStyle, active && platformActiveStyle]}
			highlight={false}
			onPress={onPress}
		>
			<Text style={[styles.dayText, active && styles.activeDayText]}>{text}</Text>
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
			// "compact" is the tappable time field that expands into a wheel.
			// Expo maps "inline" onto SwiftUI's graphical style, which is the
			// calendar picker and does not make sense for an hour-and-minute
			// picker: it renders oddly and will not open.
			displayIos="compact"
			format={format}
			initialDate={props.date}
			mode="time"
			onDateChange={(newDate: Moment) => {
				let oldMoment = moment.tz(timezone())

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
	iOSDayWrapper: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 20,
		margin: 5,
		backgroundColor: c.tertiarySystemGroupedBackground,
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
