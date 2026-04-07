/**
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
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {RootStackParamList} from '../../../navigation/types'

// Simplification 2: Centralize building mutations with useReducer

export type BuildingAction =
	| {type: 'EDIT_NAME'; name: string}
	| {
			type: 'EDIT_SCHEDULE'
			index: number
			schedule: NamedBuildingScheduleType
	  }
	| {type: 'DELETE_SCHEDULE'; index: number}
	| {type: 'ADD_SCHEDULE'}
	| {type: 'ADD_HOURS_ROW'; scheduleIndex: number}
	| {
			type: 'EDIT_HOURS_ROW'
			scheduleIndex: number
			setIndex: number
			data: SingleBuildingScheduleType
	  }
	| {type: 'DELETE_HOURS_ROW'; scheduleIndex: number; setIndex: number}

export function buildingReducer(
	state: BuildingType,
	action: BuildingAction,
): BuildingType {
	switch (action.type) {
		case 'EDIT_NAME':
			return {...state, name: action.name}

		case 'EDIT_SCHEDULE': {
			let schedules = [...state.schedule]
			schedules[action.index] = action.schedule
			return {...state, schedule: schedules}
		}

		case 'DELETE_SCHEDULE': {
			let schedules = [...state.schedule]
			schedules.splice(action.index, 1)
			return {...state, schedule: schedules}
		}

		case 'ADD_SCHEDULE':
			return {
				...state,
				schedule: [
					...state.schedule,
					{title: 'Hours', hours: [blankSchedule()]},
				],
			}

		case 'ADD_HOURS_ROW': {
			let schedules = [...state.schedule]
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours: [...schedules[action.scheduleIndex].hours, blankSchedule()],
			}
			return {...state, schedule: schedules}
		}

		case 'EDIT_HOURS_ROW': {
			let schedules = [...state.schedule]
			let hours = [...schedules[action.scheduleIndex].hours]
			hours[action.setIndex] = action.data
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours,
			}
			return {...state, schedule: schedules}
		}

		case 'DELETE_HOURS_ROW': {
			let schedules = [...state.schedule]
			let hours = [...schedules[action.scheduleIndex].hours]
			hours.splice(action.setIndex, 1)
			schedules[action.scheduleIndex] = {
				...schedules[action.scheduleIndex],
				hours,
			}
			return {...state, schedule: schedules}
		}

		default:
			return state
	}
}

// Simplification 3: Extract useBuildingEditor custom hook

function useBuildingEditor(
	initialBuilding: BuildingType,
	navigation: NativeStackNavigationProp<RootStackParamList>,
) {
	let [building, dispatch] = React.useReducer(buildingReducer, initialBuilding)

	// Simplification 1: Derive hasUnsavedChanges with useMemo instead of useState+useEffect
	let initialBuildingYaml = React.useMemo(
		() => jsYaml.dump(initialBuilding),
		[initialBuilding],
	)

	let hasUnsavedChanges = React.useMemo(
		() => jsYaml.dump(building) !== initialBuildingYaml,
		[building, initialBuildingYaml],
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

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number, set?: SingleBuildingScheduleType) =>
			navigation.navigate('BuildingHoursScheduleEditor', {
				set: set,
				onEditSet: (editedData: SingleBuildingScheduleType) =>
					dispatch({
						type: 'EDIT_HOURS_ROW',
						scheduleIndex: scheduleIdx,
						setIndex: setIdx,
						data: editedData,
					}),
				onDeleteSet: () =>
					dispatch({
						type: 'DELETE_HOURS_ROW',
						scheduleIndex: scheduleIdx,
						setIndex: setIdx,
					}),
			}),
		[navigation],
	)

	let submit = React.useCallback((): void => {
		console.log(JSON.stringify(building))
		submitReport(initialBuilding, building)
	}, [building, initialBuilding])

	return {building, dispatch, openEditor, submit}
}

export let BuildingHoursProblemReportView = (): JSX.Element => {
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {initialBuilding} = route.params

	let {building, dispatch, openEditor, submit} = useBuildingEditor(
		initialBuilding,
		navigation,
	)

	let {schedule: schedules = [], name} = building

	return (
		<ScrollView>
			<InfoHeader
				message="If you could change what is incorrect and share it with us we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="NAME">
					<TitleCell
						onChange={(newName) => dispatch({type: 'EDIT_NAME', name: newName})}
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
			type: 'EDIT_SCHEDULE',
			index: scheduleIndex,
			schedule: {...schedule, title: newValue},
		})
	}

	let editNotes = (newValue: string) => {
		dispatch({
			type: 'EDIT_SCHEDULE',
			index: scheduleIndex,
			schedule: {...schedule, notes: newValue},
		})
	}

	let toggleChapel = (newValue: boolean) => {
		dispatch({
			type: 'EDIT_SCHEDULE',
			index: scheduleIndex,
			schedule: {...schedule, closedForChapelTime: newValue},
		})
	}

	let addHoursRow = () => {
		dispatch({type: 'ADD_HOURS_ROW', scheduleIndex})
	}

	let deleteSchedule = () => {
		dispatch({type: 'DELETE_SCHEDULE', index: scheduleIndex})
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
