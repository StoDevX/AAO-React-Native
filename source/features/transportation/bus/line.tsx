import * as React from 'react'
import {useState} from 'react'
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import type {BusSchedule, UnprocessedBusLine, DayOfWeek} from './types'
import {
	BusStateEnum,
	busPropsForRow,
	findBusTarget,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
} from './lib'
import type {Moment} from 'moment-timezone'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import {Separator} from '@frogpond/separator'
import {BusStopRow} from './components/bus-stop-row'
import {ListFooter, ListRow} from '@frogpond/lists'
import {InfoHeader} from '@frogpond/info-header'
import * as c from '@frogpond/colors'
import {useRouter} from 'expo-router'
import {BUS_FOOTER_MESSAGE} from './constants'
import {DayPickerHeader, momentToDayOfWeek, createMomentForDay} from './components/day-picker'

/// The corner radius and side margin iOS gives an inset-grouped section.
const CARD_RADIUS = 10
const CARD_MARGIN = 16

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemGroupedBackground,
	},
	/**
	 * The inset-grouped card the rows sit in, drawn by hand rather than by a
	 * SwiftUI `List`: the progress bar runs continuously down the route and its
	 * dots are pulled up onto the bar above them by a negative margin, which a
	 * list clips at every row boundary. One card clips only its own ends, where
	 * the bar stops anyway.
	 */
	card: {
		backgroundColor: c.secondarySystemGroupedBackground,
		borderRadius: CARD_RADIUS,
		marginHorizontal: CARD_MARGIN,
		overflow: 'hidden',
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
	now: Moment
}

function startsIn(now: Moment, start?: Moment | null) {
	if (!start) {
		return 'Error'
	}

	let nowCopy = now.clone()
	return `Starts ${nowCopy.seconds(0).to(start)}`
}

export function deriveFromProps({line, now}: {line: UnprocessedBusLine; now: Moment}): {
	subtitle: string
	status: BusStateEnum
	schedule: BusSchedule
	currentBusIteration: number | null
	parkedStopIndex: number | null
} {
	// The line as a whole, which every row below reads from.
	let processedLine = processBusLine(line, now)

	let scheduleForToday = getScheduleForNow(processedLine.schedules, now)
	let {times, status, index, nextStart, parkedStopIndex} = getCurrentBusIteration(
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
				} else if (now.isBefore(first)) {
					subtitle = startsIn(now, first)
				} else if (now.isAfter(last)) {
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
		subtitle += ` (${now.format('h:mma')})`
	}

	return {
		subtitle: subtitle,
		status: status,
		schedule: scheduleForToday,
		currentBusIteration: index,
		parkedStopIndex: parkedStopIndex,
	}
}

export function BusLine(props: Props): React.ReactNode {
	let {line, now} = props
	let router = useRouter()

	const currentDay = momentToDayOfWeek(now)

	// Only the user's own pick is state. The day shown otherwise follows the
	// clock, so the schedule rolls over to the new day at midnight by itself.
	let [dayOverride, setDayOverride] = useState<DayOfWeek | null>(null)
	let selectedDay = dayOverride ?? currentDay

	const momentForSelectedDay = createMomentForDay(now, selectedDay)

	let {schedule, subtitle, currentBusIteration, parkedStopIndex, status} = deriveFromProps({
		line,
		now: momentForSelectedDay,
	})

	let busTarget = findBusTarget(
		schedule,
		{status, index: currentBusIteration, parkedStopIndex},
		momentForSelectedDay,
	)

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
				onDaySelect={setDayOverride}
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

	let timetable = schedule.timetable

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
			{headerElement}
			<View style={styles.card}>
				{timetable.length === 0
					? EMPTY_SCHEDULE_MESSAGE
					: timetable.map((item, index) => (
							<React.Fragment key={`${item.name}-${index}`}>
								{index > 0 ? <BusLineSeparator /> : null}
								<TouchableOpacity
									onPress={() => {
										router.push({
											pathname: '/BusRouteDetail',
											params: {line: line.line, day: selectedDay, stopName: item.name},
										})
									}}
								>
									<BusStopRow
										barColor={line.colors.bar}
										{...busPropsForRow(busTarget, index)}
										currentStopColor={line.colors.dot}
										departureIndex={currentBusIteration}
										isFirstRow={index === 0}
										isLastRow={index === timetable.length - 1}
										now={momentForSelectedDay}
										status={status}
										stop={item}
									/>
								</TouchableOpacity>
							</React.Fragment>
						))}
			</View>
			{footerElement}
		</ScrollView>
	)
}
