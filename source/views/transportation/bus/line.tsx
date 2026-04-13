import * as React from 'react'
import {useEffect, useState} from 'react'
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import type {BusSchedule, UnprocessedBusLine, DayOfWeek} from './types'
import {
	BusStateEnum,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
} from './lib'
import type {Temporal} from 'temporal-polyfill'
import {
	relativeTo,
	isBefore as temporalIsBefore,
	isAfter as temporalIsAfter,
	format as temporalFormat,
} from '../../../lib/temporal'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import {Separator} from '@frogpond/separator'
import {BusStopRow} from './components/bus-stop-row'
import {ListFooter, ListRow} from '@frogpond/lists'
import {InfoHeader} from '@frogpond/info-header'
import * as c from '@frogpond/colors'
import {useNavigation} from '@react-navigation/native'
import {BUS_FOOTER_MESSAGE} from './constants'
import {
	DayPickerHeader,
	momentToDayOfWeek,
	createMomentForDay,
} from './components/day-picker'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.secondarySystemGroupedBackground,
	},
	label: {
		color: c.label,
	},
	separator: {
		marginLeft: 45,
		// erase the gap in the bar caused by the separators' block-ness
		marginTop: -1,
	},
	headerContainer: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingVertical: 6,
		backgroundColor: c.systemGroupedBackground,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.separator,
		borderBottomColor: c.separator,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTextContainer: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: '500',
		color: c.label,
	},
	headerSubtitle: {
		fontSize: 16,
		fontWeight: '400',
		color: c.secondaryLabel,
	},
})

const isTruthy = (x: unknown) => Boolean(x)
const BusLineSeparator = () => <Separator style={styles.separator} />
const EMPTY_SCHEDULE_MESSAGE = (
	<ListRow>
		<Text style={styles.label}>This line is not running today.</Text>
	</ListRow>
)

type Props = {
	line: UnprocessedBusLine
	now: Temporal.ZonedDateTime
	openMap: () => unknown
}

function startsIn(
	now: Temporal.ZonedDateTime,
	start?: Temporal.ZonedDateTime | null,
) {
	if (!start) {
		return 'Error'
	}

	let nowNoSeconds = now.with({
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	})
	return `Starts ${relativeTo(nowNoSeconds, start)}`
}

function deriveFromProps({
	line,
	now,
}: {
	line: UnprocessedBusLine
	now: Temporal.ZonedDateTime
}) {
	// Finds the stuff that's shared between FlatList and renderItem
	let processedLine = processBusLine(line, now)

	let scheduleForToday = getScheduleForNow(processedLine.schedules, now)
	let {times, status, index, nextStart} = getCurrentBusIteration(
		scheduleForToday,
		now,
	)

	let isLastBus = index === scheduleForToday.times.length - 1

	let subtitle = 'Error'
	switch (status) {
		case 'none':
			subtitle = 'Not running today'
			break
		case 'before-start':
		case 'between-rounds':
			subtitle = startsIn(now, nextStart)
			break
		case 'after-end':
			subtitle = 'Over for today'
			break
		case 'running': {
			if (isLastBus) {
				subtitle = 'Last Bus'
			} else {
				let first = find(times, isTruthy)
				let last = findLast(times, isTruthy)
				if (!first || !last) {
					subtitle = 'Not running today'
				} else if (temporalIsBefore(now, first)) {
					subtitle = startsIn(now, first)
				} else if (temporalIsAfter(now, last)) {
					subtitle = 'Running'
				} else {
					subtitle = 'Running'
				}
			}
			break
		}
		default: {
			// TODO(rye): Find a replacement for this.
			// ;(status: empty)
		}
	}

	if (process.env.NODE_ENV !== 'production') {
		// for debugging
		subtitle += ` (${temporalFormat(now, 'h:mma')})`
	}

	return {
		subtitle: subtitle,
		status: status,
		schedule: scheduleForToday,
		currentBusIteration: index,
	}
}

export function BusLine(props: Props): JSX.Element {
	let {line, now} = props
	let navigation = useNavigation()

	let [schedule, setSchedule] = useState<BusSchedule | null>(null)
	let [subtitle, setSubtitle] = useState<string>('')
	let [currentBusIteration, setCurrentBusIteration] = useState<number | null>(
		null,
	)
	let [status, setStatus] = useState<BusStateEnum>('none')
	let [selectedDay, setSelectedDay] = useState<DayOfWeek>(() =>
		momentToDayOfWeek(now),
	)

	const currentDay = momentToDayOfWeek(now)

	useEffect(() => {
		const newCurrentDay = momentToDayOfWeek(now)
		if (selectedDay === currentDay && newCurrentDay !== currentDay) {
			setSelectedDay(newCurrentDay)
		}
	}, [now, selectedDay, currentDay])

	useEffect(() => {
		const momentForSelectedDay = createMomentForDay(now, selectedDay)

		let {
			schedule: scheduleForToday,
			subtitle: scheduleSubtitle,
			currentBusIteration: busIteration,
			status: currentStatus,
		} = deriveFromProps({
			line,
			now: momentForSelectedDay,
		})
		setSchedule(scheduleForToday)
		setSubtitle(scheduleSubtitle)
		setStatus(currentStatus)
		setCurrentBusIteration(busIteration)
	}, [line, now, selectedDay])

	let INFO_EL = (
		<View style={styles.headerContainer}>
			<View style={styles.headerTextContainer}>
				<Text>
					<Text style={[styles.headerTitle]}>{line.line}</Text>
					{subtitle ? (
						<Text style={styles.headerSubtitle}>
							{' — '}
							{subtitle}
						</Text>
					) : null}
				</Text>
			</View>

			<DayPickerHeader
				accentColor={line.colors.bar}
				currentDay={currentDay}
				onDaySelect={setSelectedDay}
				selectedDay={selectedDay}
			/>
		</View>
	)

	let lineMessage = line.notice || ''

	let footerElement = <ListFooter title={BUS_FOOTER_MESSAGE} />

	let headerElement = lineMessage ? (
		<>
			<InfoHeader message={lineMessage} title={`About ${line.line}`} />
			{INFO_EL}
		</>
	) : (
		INFO_EL
	)

	let timetable = schedule?.timetable ?? []

	const momentForSelectedDay = createMomentForDay(now, selectedDay)

	return (
		<FlatList
			ItemSeparatorComponent={BusLineSeparator}
			ListEmptyComponent={EMPTY_SCHEDULE_MESSAGE}
			ListFooterComponent={footerElement}
			ListHeaderComponent={headerElement}
			data={timetable}
			keyExtractor={(item, index) => `${item.name}-${index}`}
			renderItem={({item, index}) => (
				<TouchableOpacity
					onPress={() => {
						navigation.navigate('BusRouteDetail', {stop: item, line, subtitle})
					}}
				>
					<BusStopRow
						barColor={line.colors.bar}
						currentStopColor={line.colors.dot}
						departureIndex={currentBusIteration}
						isFirstRow={index === 0}
						isLastRow={timetable.length === 0 || index === timetable.length - 1}
						now={momentForSelectedDay}
						status={status}
						stop={item}
					/>
				</TouchableOpacity>
			)}
			style={styles.container}
		/>
	)
}
