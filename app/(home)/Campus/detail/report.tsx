import * as React from 'react'
import {Stack, useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {usePreventRemove} from 'expo-router/react-navigation'
import {useQuery} from '@tanstack/react-query'
import {Alert, StyleSheet} from 'react-native'
import {Host, List, Section, Text, Toggle, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, frame, listStyle} from '@expo/ui/swift-ui/modifiers'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {ActionRow, DetailRow, NavigationRow} from '../../../../source/components/rows'
import {SyncedTextField} from '../../../../source/components/synced-text-field'
import type {Campus} from '../../../../source/features/building-hours/query'
import {buildingByNameOptions, parseCampus} from '../../../../source/features/building-hours/query'
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../../../../source/features/building-hours/types'
import {summarizeDays, formatBuildingTimes} from '../../../../source/features/building-hours/lib'
import {submitReport} from '../../../../source/features/building-hours/report/submit'
import type {BuildingAction} from '../../../../source/features/building-hours/report/building-reducer'
import {useBuildingReport} from '../../../../source/features/building-hours/report/context'

function useBuildingEditor(initialBuilding: BuildingType, campus: Campus) {
	let router = useRouter()
	let navigation = useNavigation()

	let {draft, hasUnsavedChanges, edit} = useBuildingReport()
	let building = draft ?? initialBuilding

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

	let openEditor = React.useCallback(
		(scheduleIdx: number, setIdx: number) =>
			router.push({
				pathname: '/Campus/detail/schedule-editor',
				params: {
					scheduleIndex: String(scheduleIdx),
					setIndex: String(setIdx),
				},
			}),
		[router],
	)

	let submit = React.useCallback((): void => {
		setSubmitted(true)
		submitReport(initialBuilding, building, campus)
	}, [building, campus, initialBuilding])

	return {building, dispatch: edit, openEditor, submit}
}

type Props = {
	initialBuilding: BuildingType
	campus: Campus
}

let CampusProblemReportView = ({initialBuilding, campus}: Props): React.ReactNode => {
	let {start, clear} = useBuildingReport()

	React.useEffect(() => {
		start(initialBuilding)
		return () => {
			clear()
		}
		// oxlint-disable-next-line react/exhaustive-deps
	}, [])

	let {building, dispatch, openEditor, submit} = useBuildingEditor(initialBuilding, campus)

	let {schedule: schedules, name} = building

	return (
		<>
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

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						<VStack alignment="leading" spacing={4}>
							<Text modifiers={[font({weight: 'semibold'})]}>Thanks for spotting a problem!</Text>
							<Text
								modifiers={[
									font({textStyle: 'subheadline'}),
									foregroundStyle(c.secondaryLabel),
									frame({maxWidth: Infinity, alignment: 'leading'}),
								]}
							>
								If you could change what is incorrect and share it with us we’d greatly appreciate
								it.
							</Text>
						</VStack>
					</Section>

					<Section title="NAME">
						<SyncedTextField
							autocapitalization="words"
							onChangeText={(newName) => dispatch({type: 'SET_BUILDING_NAME', name: newName})}
							placeholder="Title"
							value={name || ''}
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
						<NavigationRow
							onPress={() => dispatch({type: 'ADD_SCHEDULE'})}
							title="Add New Schedule"
						/>
					</Section>
				</List>
			</Host>
		</>
	)
}

type EditableScheduleProps = {
	schedule: NamedBuildingScheduleType
	scheduleIndex: number
	dispatch: (action: BuildingAction) => void
	editRow: (schedIdx: number, setIdx: number) => void
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
		dispatch({type: 'DELETE_SCHEDULE', scheduleIndex})
	}

	let now = moment.tz(timezone())

	return (
		<Section title="INFORMATION">
			<SyncedTextField
				autocapitalization="words"
				onChangeText={editTitle}
				placeholder="Title"
				value={schedule.title || ''}
			/>
			<SyncedTextField
				autocapitalization="sentences"
				multiline={true}
				onChangeText={editNotes}
				placeholder="Notes"
				value={schedule.notes || ''}
			/>

			<Toggle
				isOn={Boolean(schedule.closedForChapelTime)}
				label="Closes for Chapel"
				onIsOnChange={toggleChapel}
			/>

			{schedule.hours.map((set, i) => (
				<TimesRow key={i} now={now} onPress={() => props.editRow(scheduleIndex, i)} set={set} />
			))}

			<NavigationRow onPress={addHoursRow} title="Add More Hours" />

			<ActionRow destructive={true} onPress={deleteSchedule} title="Delete Schedule" />
		</Section>
	)
}

type TimesRowProps = {
	set: SingleBuildingScheduleType
	onPress: () => void
	now: Moment
}

const TimesRow = ({set, now, onPress}: TimesRowProps) => (
	<DetailRow
		label={set.days.length ? summarizeDays(set.days) : 'Days'}
		onPress={onPress}
		value={formatBuildingTimes(set, now)}
	/>
)

function CampusProblemReportLoader(): React.ReactNode {
	let {name, campus: campusParam} = useLocalSearchParams<{name: string; campus?: string}>()
	let campus = parseCampus(campusParam)
	let {data: building, isLoading, error, refetch} = useQuery(buildingByNameOptions(campus, name))

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

	return <CampusProblemReportView campus={campus} initialBuilding={building} />
}

export default function CampusProblemReportPage(): React.ReactNode {
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

			<CampusProblemReportLoader />
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
