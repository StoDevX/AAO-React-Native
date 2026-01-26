/**
 * Building Hours "report a problem" screen.
 */

import * as React from 'react'
import {Alert, ScrollView, Text, View, Modal, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
import jsYaml from 'js-yaml'
import {InfoHeader} from '@frogpond/info-header'
import {Touchable} from '@frogpond/touchable'
import * as c from '@frogpond/colors'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {
	CellTextField,
	CellToggle,
	DeleteButtonCell,
	ButtonCell,
} from '@frogpond/tableview/cells'
import type {
	BuildingType,
	DayOfWeekEnumType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../../../../views/building-hours/types'
import {
	summarizeDays,
	formatBuildingTimes,
	blankSchedule,
	parseHours,
	summarizeDaysAndHours,
} from '../../../../views/building-hours/lib'
import {submitReport} from '../../../../views/building-hours/report/submit'
import {
	useLocalSearchParams,
	useRouter,
	useNavigation,
	Stack,
} from 'expo-router'
import {useSingleBuilding} from '../../../../views/building-hours/query'
import {NoticeView} from '@frogpond/notice'
import {Row} from '@frogpond/layout'
import {DatePicker} from '@frogpond/datepicker'
import {xor} from 'lodash'
import {CloseScreenButton} from '@frogpond/navigation-buttons'

export default function BuildingHoursProblemReportView(): React.JSX.Element {
	const {locationName} =
		useLocalSearchParams<'/building-hours/location/[locationName]/edit'>()
	let query = useSingleBuilding(locationName)

	if (query.error) {
		return (
			<NoticeView text={`Error loading building: ${query.error.message}`} />
		)
	}

	if (query.isPending) {
		return <NoticeView text="Loading..." />
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Report a Problem',
					presentation: 'modal',
					headerRight: () => <CloseScreenButton title="Discard" />,
					/**
					 * Explicility setting `gestureEnabled` to false otherwise we can end up with a
					 * a screen that gets removed natively but did not get removed from JS state.
					 *
					 * This happens if the action was prevented in a `beforeRemove` listener which:
					 * (1) we are currently doing, and
					 * (2) is not fully supported in native-stack.
					 */
					gestureEnabled: false,
				}}
			/>
			<InnerBuildingHoursProblemReportView initialBuilding={query.data} />
		</>
	)
}

function InnerBuildingHoursProblemReportView({
	initialBuilding,
}: {
	initialBuilding: BuildingType
}): React.JSX.Element {
	let navigation = useNavigation()
	let [building, setBuilding] = React.useState<BuildingType>(initialBuilding)

	// used for checking against unsaved edits
	let [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
	let initialBuildingYaml = React.useMemo(
		() => jsYaml.dump(initialBuilding),
		[initialBuilding],
	)

	/**
	 * checking for unsaved edits
	 *
	 * noting that we also have `gestureEnabled` set to false in the navigation options
	 * (ios only) to prevent dismissing the modal without prompting.
	 * https://reactnavigation.org/docs/preventing-going-back
	 */
	React.useEffect(() => {
		let listener = navigation.addListener('beforeRemove', (event) => {
			if (!hasUnsavedChanges) {
				return
			}

			event.preventDefault()

			Alert.alert(
				'Discard changes?',
				'You have made unsaved changes. Are you sure you want to discard them?',
				[
					{text: 'Edit', style: 'cancel', onPress: noop},
					{
						text: 'Discard',
						style: 'destructive',
						onPress: () => navigation.dispatch(event.data.action),
					},
				],
			)
		})
		return () => {
			navigation.removeListener('beforeRemove', listener)
		}
	}, [navigation, hasUnsavedChanges])

	React.useEffect(() => {
		setHasUnsavedChanges(jsYaml.dump(building) !== initialBuildingYaml)
	}, [building, initialBuildingYaml])

	let editName = (newName: BuildingType['name']) => {
		setBuilding({...building, name: newName})
	}

	let editSchedule = (idx: number, newSchedule: NamedBuildingScheduleType) => {
		let schedules = [...building.schedule]
		schedules.splice(idx, 1, newSchedule)

		setBuilding({...building, schedule: schedules})
	}

	let deleteSchedule = (idx: number) => {
		let schedules = [...building.schedule]
		schedules.splice(idx, 1)

		setBuilding({...building, schedule: schedules})
	}

	let addSchedule = () => {
		setBuilding({
			...building,
			schedule: [
				...building.schedule,
				{title: 'Hours', hours: [blankSchedule()]},
			],
		})
	}

	let addHoursRow = (idx: number) => {
		let schedules = [...building.schedule]

		schedules[idx] = {
			...schedules[idx],
			hours: [...schedules[idx].hours, blankSchedule()],
		}

		setBuilding({...building, schedule: schedules})
	}

	let submit = (): void => {
		setHasUnsavedChanges(false)
		submitReport(initialBuilding, building)
	}

	let {schedule: schedules = [], name} = building

	return (
		<ScrollView>
			<InfoHeader
				message="If you could change what is incorrect and share it with us we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="NAME">
					<TitleCell onChange={editName} text={name || ''} />
				</Section>

				{schedules.map((s: NamedBuildingScheduleType, i) => (
					<EditableSchedule
						key={i}
						addRow={addHoursRow}
						onDelete={deleteSchedule}
						onEditSchedule={editSchedule}
						schedule={s}
						scheduleIndex={i}
					/>
				))}

				<Section>
					<Cell
						accessory="DisclosureIndicator"
						onPress={addSchedule}
						title="Add New Schedule"
					/>
				</Section>

				<Section footer="Thanks for reporting!">
					<ButtonCell
						accessoryIcon="send"
						onPress={submit}
						title="Submit Report"
					/>
				</Section>
			</TableView>
		</ScrollView>
	)
}

type EditableScheduleProps = {
	schedule: NamedBuildingScheduleType
	scheduleIndex: number
	addRow: (idx: number) => void
	onEditSchedule: (idx: number, set: NamedBuildingScheduleType) => void
	onDelete: (idx: number) => void
}

const EditableSchedule = (props: EditableScheduleProps) => {
	let onEdit = (data: Partial<NamedBuildingScheduleType>) => {
		let idx = props.scheduleIndex
		props.onEditSchedule(idx, {...props.schedule, ...data})
	}

	let editTitle = (newValue: string) => onEdit({title: newValue})

	let editNotes = (newValue: string) => onEdit({notes: newValue})

	let toggleChapel = (newValue: boolean) =>
		onEdit({closedForChapelTime: newValue})

	let addHoursRow = () => props.addRow(props.scheduleIndex)

	let editHoursRow = (setIdx: number, newData: SingleBuildingScheduleType) => {
		let hours = [...props.schedule.hours]
		hours.splice(setIdx, 1, newData)

		onEdit({hours})
	}

	let deleteHoursRow = (setIdx: number) => {
		let hours = [...props.schedule.hours]
		hours.splice(setIdx, 1)

		onEdit({hours})
	}

	let deleteSchedule = () => props.onDelete(props.scheduleIndex)

	let {schedule} = props
	let now = moment()

	return (
		<View>
			<Section header="INFORMATION">
				<TitleCell onChange={editTitle} text={schedule.title || ''} />
				<NotesCell onChange={editNotes} text={schedule.notes || ''} />

				<CellToggle
					label="Closes for Chapel"
					onChange={toggleChapel}
					value={Boolean(schedule.closedForChapelTime)}
				/>

				{schedule.hours.map((set, i) => (
					<TimesCell
						key={i}
						now={now}
						onEdit={(edited) => editHoursRow(i, edited)}
						onDelete={() => deleteHoursRow(i)}
						set={set}
						setIndex={i}
					/>
				))}

				<Cell
					accessory="DisclosureIndicator"
					onPress={addHoursRow}
					title="Add More Hours"
				/>

				<DeleteButtonCell onPress={deleteSchedule} title="Delete Schedule" />
			</Section>
		</View>
	)
}

type TextFieldProps = {text: string; onChange: (text: string) => void}
// "Title" will become a textfield like the login form
const TitleCell = ({text, onChange}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
		placeholder="Title"
		returnKeyType="done"
		value={text}
	/>
)

// "Notes" will become a big textarea
const NotesCell = ({text, onChange}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="sentences"
		onChangeText={onChange}
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
		placeholder="Notes"
		returnKeyType="done"
		value={text}
	/>
)

type TimesCellProps = {
	set: SingleBuildingScheduleType
	setIndex: number
	onEdit: (set: SingleBuildingScheduleType) => void
	onDelete: () => void
	now: Moment
}

const TimesCell = (props: TimesCellProps) => {
	let {set, now} = props
	let [isEditing, setIsEditing] = React.useState(false)

	if (isEditing) {
		return (
			<HourEditorView
				initialSchedule={set}
				onDelete={() => {
					props.onDelete()
					setIsEditing(false)
				}}
				onEdit={(newSet) => {
					props.onEdit(newSet)
					setIsEditing(false)
				}}
			/>
		)
	}

	return (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="RightDetail"
			detail={formatBuildingTimes(set, now)}
			onPress={() => setIsEditing(true)}
			title={set.days.length ? summarizeDays(set.days) : 'Days'}
		/>
	)
}

function HourEditorView(params: {
	initialSchedule: SingleBuildingScheduleType
	onDelete: () => void
	onEdit: (set: SingleBuildingScheduleType) => void
}): React.JSX.Element {
	let [editedSchedule, setEditedSchedule] = React.useState(
		params.initialSchedule,
	)

	let deleteSet = () => {
		params.onDelete()
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		let newSet = {...editedSchedule, days: newDays}
		setEditedSchedule(newSet)
	}

	let onChangeOpen = (newDate: Moment) => {
		let newSet = {...editedSchedule, from: newDate.format('h:mma')}
		setEditedSchedule(newSet)
	}

	let onChangeClose = (newDate: Moment) => {
		let newSet = {...editedSchedule, to: newDate.format('h:mma')}
		setEditedSchedule(newSet)
	}

	let {open, close} = parseHours(editedSchedule, moment())

	let summary = editedSchedule.days.length
		? summarizeDaysAndHours(editedSchedule)
		: 'Select a day to get started.'

	return (
		<Modal
			visible={true}
			animationType="slide"
			allowSwipeDismissal={true}
			onRequestClose={() => params.onEdit(editedSchedule)}
		>
			<ScrollView>
				<TableView>
					<Section footer={summary}>
						<WeekToggles
							days={editedSchedule.days}
							onChangeDays={onChangeDays}
						/>
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
		</Modal>
	)
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[]
	onChangeDays: (days: DayOfWeekEnumType[]) => unknown
}

function WeekToggles(props: WeekTogglesProps) {
	let {onChangeDays, days} = props
	let allDays: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	return (
		<Row style={styles.iOSweekToggles}>
			{allDays.map((day) => (
				<ToggleButton
					key={day}
					active={props.days.includes(day)}
					onPress={(day) => onChangeDays(xor(days, [day]))}
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

const ToggleButton = ({active, text, onPress}: ToggleButtonProps) => {
	return (
		<Touchable
			containerStyle={[styles.iOSDayWrapper, active && styles.iOSDayActive]}
			highlight={false}
			onPress={() => onPress(text)}
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
			onDateChange={(newDate) => {
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
