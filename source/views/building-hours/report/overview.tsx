/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import * as React from 'react'
import {Alert, ScrollView, Platform, View} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
import jsYaml from 'js-yaml'
import {InfoHeader} from '@frogpond/info-header'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {
	CellTextField,
	CellToggle,
	DeleteButtonCell,
	ButtonCell,
} from '@frogpond/tableview/cells'
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import {summarizeDays, formatBuildingTimes, blankSchedule} from '../lib'
import {submitReport} from './submit'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {RootStackParamList} from '../../../navigation/types'

export let BuildingHoursProblemReportView = (): JSX.Element => {
	let navigation = useNavigation()
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {initialBuilding} = route.params

	let [building, setBuilding] = React.useState(initialBuilding)

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
	React.useEffect(
		() =>
			navigation.addListener('beforeRemove', (event) => {
				if (!hasUnsavedChanges || Platform.OS === 'android') {
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
			}),
		[navigation, hasUnsavedChanges],
	)

	React.useEffect(() => {
		setHasUnsavedChanges(jsYaml.dump(building) !== initialBuildingYaml)
	}, [building, initialBuildingYaml])

	let editName = (newName: BuildingType['name']) => {
		setBuilding({
			...building,
			name: newName,
		})
	}

	let editSchedule = (idx: number, newSchedule: NamedBuildingScheduleType) => {
		let schedules = [...building.schedule]
		schedules.splice(idx, 1, newSchedule)

		setBuilding({
			...building,
			schedule: schedules,
		})
	}

	let deleteSchedule = (idx: number) => {
		let schedules = [...building.schedule]
		schedules.splice(idx, 1)

		setBuilding({
			...building,
			schedule: schedules,
		})
	}

	let addSchedule = () => {
		setBuilding({
			...building,
			schedule: [
				...building.schedule,
				{
					title: 'Hours',
					hours: [blankSchedule()],
				},
			],
		})
	}

	let addHoursRow = (idx: number) => {
		let schedules = [...building.schedule]

		schedules[idx] = {
			...schedules[idx],
			hours: [...schedules[idx].hours, blankSchedule()],
		}

		setBuilding({
			...building,
			schedule: schedules,
		})
	}

	let editHoursRow = React.useCallback(
		(
			scheduleIdx: number,
			setIdx: number,
			newData: SingleBuildingScheduleType,
		) => {
			let schedules = [...building.schedule]

			let hours = [...schedules[scheduleIdx].hours]
			hours.splice(setIdx, 1, newData)

			schedules[scheduleIdx] = {...schedules[scheduleIdx], hours}

			setBuilding({
				...building,
				schedule: schedules,
			})
		},
		[building],
	)

	let deleteHoursRow = React.useCallback(
		(scheduleIdx: number, setIdx: number) => {
			let schedules = [...building.schedule]

			let hours = [...schedules[scheduleIdx].hours]
			hours.splice(setIdx, 1)

			schedules[scheduleIdx] = {...schedules[scheduleIdx], hours}

			setBuilding({
				...building,
				schedule: schedules,
			})
		},
		[building],
	)

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number, set?: SingleBuildingScheduleType) =>
			navigation.navigate('BuildingHoursScheduleEditor', {
				set: set,
				onEditSet: (editedData: SingleBuildingScheduleType) =>
					editHoursRow(scheduleIdx, setIdx, editedData),
				onDeleteSet: () => deleteHoursRow(scheduleIdx, setIdx),
			}),
		[deleteHoursRow, editHoursRow, navigation],
	)

	let submit = (): void => {
		console.log(JSON.stringify(building))
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
						editRow={openEditor}
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
	editRow: (
		schedIdx: number,
		setIdx: number,
		set: SingleBuildingScheduleType,
	) => void
	onEditSchedule: (idx: number, set: NamedBuildingScheduleType) => void
	onDelete: (idx: number) => void
}

const EditableSchedule = (props: EditableScheduleProps) => {
	let onEdit = (data: Partial<NamedBuildingScheduleType>) => {
		let idx = props.scheduleIndex
		props.onEditSchedule(idx, {
			...props.schedule,
			...data,
		})
	}

	let editTitle = (newValue: string) => {
		onEdit({title: newValue})
	}

	let editNotes = (newValue: string) => {
		onEdit({notes: newValue})
	}

	let toggleChapel = (newValue: boolean) => {
		onEdit({closedForChapelTime: newValue})
	}

	let addHoursRow = () => {
		props.addRow(props.scheduleIndex)
	}

	let deleteSchedule = () => {
		props.onDelete(props.scheduleIndex)
	}

	let openEditor = (setIndex: number, hoursSet: SingleBuildingScheduleType) => {
		props.editRow(props.scheduleIndex, setIndex, hoursSet)
	}

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
						onPress={openEditor}
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
	onPress: (setIdx: number, set: SingleBuildingScheduleType) => void
	now: Moment
}

const TimesCell = (props: TimesCellProps) => {
	let onPress = () => {
		props.onPress(props.setIndex, props.set)
	}

	let {set, now} = props

	return (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="RightDetail"
			detail={formatBuildingTimes(set, now)}
			onPress={onPress}
			title={set.days.length ? summarizeDays(set.days) : 'Days'}
		/>
	)
}

export const NavigationKey = 'BuildingHoursProblemReport'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Report a Problem',
	presentation: 'modal',
	headerRight: () =>
		Platform.OS === 'ios' && <CloseScreenButton title="Discard" />,
	/**
	 * Explicility setting `gestureEnabled` to false otherwise we can end up with a
	 * a screen that gets removed natively but did not get removed from JS state.
	 *
	 * This happens if the action was prevented in a `beforeRemove` listener which:
	 * (1) we are currently doing, and
	 * (2) is not fully supported in native-stack.
	 */
	gestureEnabled: false,
}
