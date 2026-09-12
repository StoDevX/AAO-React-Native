import * as React from 'react'
import {StyleSheet} from 'react-native'
import xor from 'lodash/xor'
import moment from 'moment-timezone'
import {Stack, useLocalSearchParams} from 'expo-router'
import {
	Button,
	DatePicker,
	Host,
	HStack,
	LabeledContent,
	List,
	Section,
	Text,
} from '@expo/ui/swift-ui'
import {buttonStyle, datePickerStyle, labelsHidden, listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'

import {ActionRow} from '../../../../source/components/rows'
import type {DayOfWeekEnumType} from '../../../../source/features/building-hours/types'
import {
	blankSchedule,
	fromPickerDate,
	parseHours,
	summarizeDaysAndHours,
	toPickerDate,
} from '../../../../source/features/building-hours/lib'
import {useBuildingReport} from '../../../../source/features/building-hours/report/context'
import {useDismissOnce} from '../../../../source/lib/use-dismiss-once'

const ALL_DAYS: DayOfWeekEnumType[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export default function BuildingHoursScheduleEditorPage(): React.ReactNode {
	let {scheduleIndex: scheduleIndexParam, setIndex: setIndexParam} = useLocalSearchParams<{
		scheduleIndex: string
		setIndex: string
	}>()
	let scheduleIndex = Number(scheduleIndexParam)
	let setIndex = Number(setIndexParam)

	let dismiss = useDismissOnce()
	let {draft, edit} = useBuildingReport()
	let set = draft?.schedule[scheduleIndex]?.hours[setIndex] ?? blankSchedule()

	let deleteSet = () => {
		edit({type: 'DELETE_HOURS', scheduleIndex, setIndex})
		dismiss()
	}

	let setHours = (data: typeof set) => {
		edit({type: 'SET_HOURS', scheduleIndex, setIndex, data})
	}

	let onChangeDays = (newDays: DayOfWeekEnumType[]) => {
		setHours({...set, days: newDays})
	}

	let {open, close} = parseHours(set, moment.tz(timezone()))

	let summary = set.days.length ? summarizeDaysAndHours(set) : 'Select a day to get started.'

	return (
		<>
			<Stack.Title>Edit Schedule</Stack.Title>

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section footer={<Text>{summary}</Text>}>
						<WeekToggles days={set.days} onChangeDays={onChangeDays} />

						<LabeledContent label="Hours">
							<HStack spacing={4}>
								<TimePicker
									date={toPickerDate(open)}
									label="Opens at"
									onChange={(picked) => setHours({...set, from: fromPickerDate(picked)})}
								/>
								<Text>—</Text>
								<TimePicker
									date={toPickerDate(close)}
									label="Closes at"
									onChange={(picked) => setHours({...set, to: fromPickerDate(picked)})}
								/>
							</HStack>
						</LabeledContent>
					</Section>

					<Section>
						<ActionRow destructive={true} onPress={deleteSet} title="Remove" />
					</Section>
				</List>
			</Host>
		</>
	)
}

type WeekTogglesProps = {
	days: DayOfWeekEnumType[]
	onChangeDays: (days: DayOfWeekEnumType[]) => void
}

/**
 * The seven days as pills, any number of which can be on at once. A `Picker`
 * would say pick one and a column of `Toggle`s would be seven rows tall, so
 * the row of buttons stays -- drawn by SwiftUI, with the platform's own
 * prominent and plain button styles saying which are chosen.
 */
function WeekToggles({days, onChangeDays}: WeekTogglesProps): React.ReactNode {
	return (
		<HStack spacing={4}>
			{ALL_DAYS.map((day) => (
				<Button
					key={day}
					modifiers={[buttonStyle(days.includes(day) ? 'borderedProminent' : 'bordered')]}
					onPress={() => {
						onChangeDays(xor(days, [day]))
					}}
				>
					<Text>{day}</Text>
				</Button>
			))}
		</HStack>
	)
}

/**
 * The tappable time field that expands into a wheel. The graphical style is
 * the month calendar, which has nothing to offer an hour and a minute.
 */
function TimePicker(props: {
	date: Date
	label: string
	onChange: (date: Date) => void
}): React.ReactNode {
	return (
		<DatePicker
			displayedComponents={['hourAndMinute']}
			modifiers={[datePickerStyle('compact'), labelsHidden()]}
			onDateChange={props.onChange}
			selection={props.date}
			title={props.label}
		/>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
