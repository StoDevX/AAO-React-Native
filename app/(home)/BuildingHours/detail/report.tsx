import * as React from 'react'
import {Stack, useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {usePreventRemove} from 'expo-router/react-navigation'
import {useQuery} from '@tanstack/react-query'
import {Alert, ScrollView, View} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
import {timezone} from '@frogpond/constants'
import {InfoHeader} from '@frogpond/info-header'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {CellTextField, CellToggle, DeleteButtonCell} from '@frogpond/tableview/cells'

import {buildingByNameOptions} from '../../../../source/features/building-hours/query'
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../../../../source/features/building-hours/types'
import {summarizeDays, formatBuildingTimes} from '../../../../source/features/building-hours/lib'
import {submitReport} from '../../../../source/features/building-hours/report/submit'
import type {BuildingAction} from '../../../../source/features/building-hours/report/building-reducer'
import {
	applyBuildingAction,
	clearReport,
	selectReportDraft,
	selectReportHasUnsavedChanges,
	startReport,
	useAppDispatch,
	useAppSelector,
} from '../../../../source/redux'
import {LoadingView, NoticeView} from '@frogpond/notice'

function useBuildingEditor(initialBuilding: BuildingType) {
	let dispatch = useAppDispatch()
	let router = useRouter()
	let navigation = useNavigation()

	let building = useAppSelector(selectReportDraft) ?? initialBuilding
	let hasUnsavedChanges = useAppSelector(selectReportHasUnsavedChanges)

	let [submitted, setSubmitted] = React.useState(false)

	/**
	 * Checks for unsaved edits before this screen leaves the stack, whether
	 * from its own back button or from the detail sheet itself being dragged
	 * down or dismissed by its backdrop. The edge-swipe gesture is not a path
	 * out here -- it is turned off below, on the same route -- so it needs no
	 * guarding.
	 *
	 * A plain `beforeRemove` listener only ever sees a pop of this screen; it
	 * has no way to tell UIKit to refuse a dismissal of the *sheet*, a level
	 * up. `usePreventRemove` additionally registers this screen's route with
	 * the navigator's `PreventRemoveProvider`, which bubbles the block up to
	 * the formSheet's own route so a native sheet dismissal is refused too.
	 * https://reactnavigation.org/docs/preventing-going-back
	 */
	usePreventRemove(hasUnsavedChanges && !submitted, ({data}) => {
		Alert.alert(
			'Discard changes?',
			'You have made unsaved changes. Are you sure you want to discard them?',
			[
				{text: 'Edit', style: 'cancel', onPress: noop},
				{
					text: 'Discard',
					style: 'destructive',
					onPress: () => navigation.dispatch(data.action),
				},
			],
		)
	})

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

let BuildingHoursProblemReportView = ({initialBuilding}: Props): React.ReactNode => {
	let appDispatch = useAppDispatch()

	React.useEffect(() => {
		appDispatch(startReport(initialBuilding))
		return () => {
			appDispatch(clearReport())
		}
		// oxlint-disable-next-line react/exhaustive-deps
	}, [])

	let {building, dispatch, openEditor, submit} = useBuildingEditor(initialBuilding)

	let {schedule: schedules, name} = building

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			{/* In the header rather than at the foot of the form: this screen
			 * exists to send the report, and every schedule a venue has pushes a
			 * cell at the bottom further down a sheet that shows about half a
			 * screen. Here it is reachable at any detent, whatever the venue. */}
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Submit Report"
					icon="paperplane.fill"
					onPress={submit}
				/>
			</Stack.Toolbar>

			<InfoHeader
				message="If you could change what is incorrect and share it with us we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="NAME">
					<TitleCell
						onChange={(newName) => dispatch({type: 'SET_BUILDING_NAME', name: newName})}
						text={name || ''}
					/>
				</Section>

				{schedules.map((s: NamedBuildingScheduleType, i: number) => (
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
			</TableView>
		</ScrollView>
	)
}

type EditableScheduleProps = {
	schedule: NamedBuildingScheduleType
	scheduleIndex: number
	dispatch: React.Dispatch<BuildingAction>
	editRow: (schedIdx: number, setIdx: number, set: SingleBuildingScheduleType) => void
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

	let now = moment.tz(timezone())

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
					<TimesCell key={i} now={now} onPress={openEditor} set={set} setIndex={i} />
				))}

				<Cell accessory="DisclosureIndicator" onPress={addHoursRow} title="Add More Hours" />

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

function BuildingHoursProblemReportLoader(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {data: building, isLoading, error, refetch} = useQuery(buildingByNameOptions(name))

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!building) {
		return <NoticeView text={`Could not find the "${name}" building.`} />
	}

	return <BuildingHoursProblemReportView initialBuilding={building} />
}

export default function BuildingHoursProblemReportPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Report a Problem</Stack.Title>
			{/* On device, the edge-swipe gesture did not reliably surface the
			 * unsaved-changes alert -- turned off here rather than guarded. */}
			<Stack.Screen options={{gestureEnabled: false}} />
			<Stack.Toolbar placement="left">
				{/* The default native back button had the same problem on device.
				 * A JS-driven `goBack()` call, the same dispatch the guard's own
				 * Discard button uses, keeps the pop and the guard in sync. */}
				<Stack.Toolbar.Button
					accessibilityLabel="Back"
					icon="chevron.left"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<BuildingHoursProblemReportLoader />
		</>
	)
}
