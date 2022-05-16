/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import * as React from 'react'
import {ScrollView, View} from 'react-native'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {InfoHeader} from '@frogpond/info-header'
import {
	TableView,
	Section,
	Cell,
	CellTextField,
	CellToggle,
	DeleteButtonCell,
	ButtonCell,
} from '@frogpond/tableview'
import type {
	BuildingType,
	NamedBuildingScheduleType,
	SingleBuildingScheduleType,
} from '../types'
import type {TopLevelViewPropsType} from '../../types'
import {summarizeDays, formatBuildingTimes, blankSchedule} from '../lib'
import {submitReport} from './submit'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'

type Props = TopLevelViewPropsType & {
	route: {params: {initialBuilding: BuildingType}}
}

export let BuildingHoursProblemReportView = (props: Props): JSX.Element => {
	let [building, setBuilding] = React.useState<BuildingType>(
		props.route.params.initialBuilding,
	)

	let navigation = useNavigation()

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
		submitReport(props.route.params.initialBuilding, building)
	}

	let {schedule: schedules = [], name} = building

	return (
		<ScrollView>
			<InfoHeader
				message="If you could tell us what the new times are, we&rsquo;d greatly appreciate it."
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
					<ButtonCell onPress={submit} title="Submit Report" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

type EditableScheduleProps = {
	schedule: NamedBuildingScheduleType
	scheduleIndex: number
	addRow: (idx: number) => any
	editRow: (
		schedIdx: number,
		setIdx: number,
		set: SingleBuildingScheduleType,
	) => any
	onEditSchedule: (idx: number, set: NamedBuildingScheduleType) => any
	onDelete: (idx: number) => any
}

class EditableSchedule extends React.PureComponent<EditableScheduleProps> {
	onEdit = (data: Partial<NamedBuildingScheduleType>) => {
		let idx = this.props.scheduleIndex
		this.props.onEditSchedule(idx, {
			...this.props.schedule,
			...data,
		})
	}

	editTitle = (newValue: string) => {
		this.onEdit({title: newValue})
	}

	editNotes = (newValue: string) => {
		this.onEdit({notes: newValue})
	}

	toggleChapel = (newValue: boolean) => {
		this.onEdit({closedForChapelTime: newValue})
	}

	addHoursRow = () => {
		this.props.addRow(this.props.scheduleIndex)
	}

	delete = () => {
		this.props.onDelete(this.props.scheduleIndex)
	}

	openEditor = (setIndex: number, hoursSet: SingleBuildingScheduleType) => {
		this.props.editRow(this.props.scheduleIndex, setIndex, hoursSet)
	}

	render() {
		let {schedule} = this.props
		let now = moment()

		return (
			<View>
				<Section header="INFORMATION">
					<TitleCell onChange={this.editTitle} text={schedule.title || ''} />
					<NotesCell onChange={this.editNotes} text={schedule.notes || ''} />

					<CellToggle
						label="Closes for Chapel"
						onChange={this.toggleChapel}
						value={Boolean(schedule.closedForChapelTime)}
					/>

					{schedule.hours.map((set, i) => (
						<TimesCell
							key={i}
							now={now}
							onPress={this.openEditor}
							set={set}
							setIndex={i}
						/>
					))}

					<Cell
						accessory="DisclosureIndicator"
						onPress={this.addHoursRow}
						title="Add More Hours"
					/>

					<DeleteButtonCell onPress={this.delete} title="Delete Schedule" />
				</Section>
			</View>
		)
	}
}

type TextFieldProps = {text: string; onChange: (text: string) => any}
// "Title" will become a textfield like the login form
const TitleCell = ({text, onChange = () => {}}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={onChange}
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
		onSubmitEditing={onChange}
		placeholder="Notes"
		returnKeyType="done"
		value={text}
	/>
)

type TimesCellProps = {
	set: SingleBuildingScheduleType
	setIndex: number
	onPress: (setIdx: number, set: SingleBuildingScheduleType) => any
	now: Moment
}

class TimesCell extends React.PureComponent<TimesCellProps> {
	onPress = () => {
		this.props.onPress(this.props.setIndex, this.props.set)
	}

	render() {
		let {set, now} = this.props

		return (
			<Cell
				accessory="DisclosureIndicator"
				cellStyle="RightDetail"
				detail={formatBuildingTimes(set, now)}
				onPress={this.onPress}
				title={set.days.length ? summarizeDays(set.days) : 'Days'}
			/>
		)
	}
}

export const NavigationKey = 'BuildingHoursProblemReport'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Report a Problem',
}
