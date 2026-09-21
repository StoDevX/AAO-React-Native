import * as React from 'react'
import {Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter} from 'expo-router'
import {usePreventRemove} from 'expo-router/react-navigation'
import {useQuery} from '@tanstack/react-query'
import {Alert, StyleSheet} from 'react-native'
import {Host, List, Picker, Section, Text, Toggle, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listStyle,
	pickerStyle,
	tag,
} from '@expo/ui/swift-ui/modifiers'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {ActionRow, DetailRow, NavigationRow} from '../../../../source/components/rows'
import {SyncedTextField} from '../../../../source/components/synced-text-field'
import type {Campus} from '../../../../source/features/building-hours/types'
import {
	buildingByNameOptions,
	buildingsOptions,
	parseCampus,
} from '../../../../source/features/building-hours/query'
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../../../../source/features/building-hours/types'
import {
	categoriesFrom,
	linkHost,
	summarizeDays,
	formatBuildingTimes,
} from '../../../../source/features/building-hours/lib'
import {submitReport} from '../../../../source/features/building-hours/report/submit'
import type {BuildingAction} from '../../../../source/features/building-hours/report/building-reducer'
import {useBuildingReport} from '../../../../source/features/building-hours/report/context'

function useBuildingEditor(initialBuilding: BuildingType, campus: Campus) {
	let router = useRouter()
	let navigation = useNavigation()

	let {draft, hasUnsavedChanges, edit, note, setNote} = useBuildingReport()
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
			router.navigate({
				pathname: '/Campus/detail/schedule-editor',
				params: {
					scheduleIndex: String(scheduleIdx),
					setIndex: String(setIdx),
				},
			}),
		[router],
	)

	let openLink = React.useCallback(
		(linkIndex: number) =>
			router.navigate({
				pathname: '/Campus/detail/link-editor',
				params: {linkIndex: String(linkIndex)},
			}),
		[router],
	)

	/**
	 * Stops a second press from opening a second editor on the same link.
	 * Both presses would read the same `links.length` from this render, so the
	 * guard is a ref rather than state — a re-render must not clear it while
	 * the push is still travelling.
	 *
	 * Unlike `useDismissOnce`, this one has to reset: the screen is still here
	 * when someone comes back from the editor, and pressing again then is a
	 * legitimate second link.
	 */
	let addingLink = React.useRef(false)

	useFocusEffect(
		React.useCallback(() => {
			addingLink.current = false
		}, []),
	)

	let addLink = React.useCallback(() => {
		if (addingLink.current) {
			return
		}
		addingLink.current = true

		// The new link lands at the end, which is where the editor that opens
		// next has to look for it. Dispatched before the push so the draft
		// already holds the link the editor is about to read.
		let linkIndex = building.links?.length ?? 0
		edit({type: 'ADD_LINK'})
		openLink(linkIndex)
	}, [building.links, edit, openLink])

	let submit = React.useCallback((): void => {
		setSubmitted(true)
		submitReport(initialBuilding, building, campus, note)
	}, [building, campus, initialBuilding, note])

	return {addLink, building, dispatch: edit, note, openEditor, openLink, setNote, submit}
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

	let {addLink, building, dispatch, note, openEditor, openLink, setNote, submit} =
		useBuildingEditor(initialBuilding, campus)

	let {schedule: schedules, name, subtitle, abbreviation, category, links = []} = building

	let {data: buildings} = useQuery(buildingsOptions(campus))
	let categories = categoriesFrom([...(buildings ?? []), building])

	return (
		<>
			{/* In the header rather than at the foot of the form: this screen
			 * exists to send the report, and every schedule a venue has pushes a
			 * cell at the bottom further down a sheet that shows about half a
			 * screen. Here it is reachable at any detent, whatever the venue. */}
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button accessibilityLabel="Submit Report" onPress={submit}>
					Submit
				</Stack.Toolbar.Button>
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

					<Section title="ABOUT">
						<SyncedTextField
							autocapitalization="words"
							onChangeText={(newName) => dispatch({type: 'UPDATE_BUILDING', data: {name: newName}})}
							placeholder="Name"
							value={name || ''}
						/>
						{/* A venue is listed under the name people say; this is where
						    the formal one is spelled out. */}
						<SyncedTextField
							autocapitalization="words"
							onChangeText={(newSubtitle) =>
								dispatch({type: 'UPDATE_BUILDING', data: {subtitle: newSubtitle}})
							}
							placeholder="Formal Name"
							value={subtitle || ''}
						/>
						<SyncedTextField
							autocapitalization="characters"
							onChangeText={(newAbbreviation) =>
								dispatch({type: 'UPDATE_BUILDING', data: {abbreviation: newAbbreviation}})
							}
							placeholder="Abbreviation"
							value={abbreviation || ''}
						/>
						{/* A picker rather than a field: a category is a section header
						    on the campus list, so one typo invents a section. */}
						<Picker<string>
							label="Category"
							modifiers={[pickerStyle('menu')]}
							onSelectionChange={(newCategory) =>
								dispatch({type: 'UPDATE_BUILDING', data: {category: newCategory}})
							}
							selection={category}
						>
							{categories.map((option) => (
								<Text key={option} modifiers={[tag(option)]}>
									{option}
								</Text>
							))}
						</Picker>
					</Section>

					{schedules.map((s: NamedBuildingScheduleType, i: number) => (
						<EditableSchedule
							// oxlint-disable-next-line react/no-array-index-key -- the index is the handle editRow edits by
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

					{/* Always drawn, even with no links, so Add Link stays reachable. */}
					<Section title="RESOURCES">
						{links.map((link, i) => (
							<DetailRow
								// oxlint-disable-next-line react/no-array-index-key -- the index is the handle the editor edits by
								key={i}
								label={link.title || 'Untitled Link'}
								onPress={() => openLink(i)}
								value={linkHost(link.url)}
							/>
						))}

						<NavigationRow onPress={addLink} title="Add Link" />
					</Section>

					<Section
						footer={<Text>Anything the fields above cannot say.</Text>}
						title="WHAT'S WRONG?"
					>
						<SyncedTextField
							autocapitalization="sentences"
							multiline={true}
							onChangeText={setNote}
							placeholder="Describe the problem"
							value={note}
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

	let zone = timezone()
	let now = moment.tz(zone)

	return (
		<Section
			// The hours below are the campus's own wall clock, the same one the
			// picker in the schedule editor writes and the YAML the report
			// carries -- say so, or a reader outside Central reads their own
			// times back and reports an hour that was never wrong.
			footer={schedule.hours.length > 0 ? <Text>Hours are in Central Time.</Text> : undefined}
			title="INFORMATION"
		>
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
				<TimesRow
					// oxlint-disable-next-line react/no-array-index-key -- the index is the handle editRow edits by
					key={i}
					now={now}
					onPress={() => props.editRow(scheduleIndex, i)}
					set={set}
					zone={zone}
				/>
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
	zone: string
}

const TimesRow = ({set, now, onPress, zone}: TimesRowProps) => (
	<DetailRow
		label={set.days.length > 0 ? summarizeDays(set.days) : 'Days'}
		onPress={onPress}
		value={formatBuildingTimes(set, now, {zone})}
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
