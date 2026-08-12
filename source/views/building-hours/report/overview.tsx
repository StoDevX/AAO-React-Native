/**
 * Building Hours "report a problem" screen.
 */

import * as React from 'react'
import {Alert, ScrollView, View} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
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
import {summarizeDays, formatBuildingTimes} from '../lib'
import {submitReport} from './submit'
import type {BuildingAction} from './building-reducer'
import {
	applyBuildingAction,
	clearReport,
	selectReportDraft,
	selectReportHasUnsavedChanges,
	startReport,
	useAppDispatch,
	useAppSelector,
} from '../../../redux'
import {useNavigation, useRouter} from 'expo-router'

function useBuildingEditor(initialBuilding: BuildingType) {
	let dispatch = useAppDispatch()
	let router = useRouter()
	let navigation = useNavigation()

	let building = useAppSelector(selectReportDraft) ?? initialBuilding
	let hasUnsavedChanges = useAppSelector(selectReportHasUnsavedChanges)

	let [submitted, setSubmitted] = React.useState(false)

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
				if (!hasUnsavedChanges || submitted) {
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
		[navigation, hasUnsavedChanges, submitted],
	)

	let dispatchAction = React.useCallback(
		(action: BuildingAction) => dispatch(applyBuildingAction(action)),
		[dispatch],
	)

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number) =>
			router.push({
				pathname: '/BuildingHoursScheduleEditor',
				params: {
					scheduleIndex: String(scheduleIdx),
					setIndex: String(setIdx),
				},
			}),
		[router],
	)

	let submit = React.useCallback((): void => {
		setSubmitted(true)
		submitReport(initialBuilding, building)
	}, [building, initialBuilding])

	return {building, dispatch: dispatchAction, openEditor, submit}
}

type Props = {
	initialBuilding: BuildingType
}

export let BuildingHoursProblemReportView = ({
	initialBuilding,
}: Props): React.ReactNode => {
	let appDispatch = useAppDispatch()

	React.useEffect(() => {
		appDispatch(startReport(initialBuilding))
		return () => {
			appDispatch(clearReport())
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	let {building, dispatch, openEditor, submit} =
		useBuildingEditor(initialBuilding)

	let {schedule: schedules = [], name} = building

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<InfoHeader
				message="If you could change what is incorrect and share it with us we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="NAME">
					<TitleCell
						onChange={(newName) =>
							dispatch({type: 'SET_BUILDING_NAME', name: newName})
						}
						text={name || ''}
					/>
				</Section>

				{schedules.map((s: NamedBuildingScheduleType, i) => (
					<EditableSchedule
						key={i}
						dispatch={dispatch}
						editRow={openEditor}
						schedule={s}
						scheduleIndex={i}
					/>
				))}

				<Section>
					<Cell
						accessory="DisclosureIndicator"
						onPress={() => dispatch({type: 'ADD_SCHEDULE'})}
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
	dispatch: React.Dispatch<BuildingAction>
	editRow: (
		schedIdx: number,
		setIdx: number,
		set: SingleBuildingScheduleType,
	) => void
}

const EditableSchedule = (props: EditableScheduleProps) => {
	let {dispatch, scheduleIndex, schedule} = props

	let editTitle = (newValue: string) => {
		dispatch({
			type: 'UPDATE_SCHEDULE',
			scheduleIndex,
			data: {title: newValue},
		})
	}

	let editNotes = (newValue: string) => {
		dispatch({
			type: 'UPDATE_SCHEDULE',
			scheduleIndex,
			data: {notes: newValue},
		})
	}

	let toggleChapel = (newValue: boolean) => {
		dispatch({
			type: 'UPDATE_SCHEDULE',
			scheduleIndex,
			data: {closedForChapelTime: newValue},
		})
	}

	let addHoursRow = () => {
		dispatch({type: 'ADD_HOURS', scheduleIndex})
	}

	let deleteSchedule = () => {
		dispatch({type: 'DELETE_SCHEDULE', scheduleIndex: scheduleIndex})
	}

	let openEditor = (setIndex: number, hoursSet: SingleBuildingScheduleType) => {
		props.editRow(scheduleIndex, setIndex, hoursSet)
	}

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
