import * as React from 'react'
import {StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import type {BusSchedule, UnprocessedBusLine} from './types'
import {
	BusStateEnum,
	busPropsForRow,
	findBusTarget,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
	scheduleSectionTitle,
} from './lib'
import type {Moment} from 'moment-timezone'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import {Separator} from '@frogpond/separator'
import {BusStopRow} from './components/bus-stop-row'
import {ListRow} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useRouter} from 'expo-router'
import {Host, List, RNHostView, Section, Text as SwiftUIText, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listRowInsets,
	listRowSeparator,
	listStyle,
} from '@expo/ui/swift-ui/modifiers'
import {BUS_FOOTER_MESSAGE, SECTION_HORIZONTAL_INSET} from './constants'
import {momentToDayOfWeek, createMomentForDay} from './components/days'
import {useBusDay} from './store'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
	label: {
		color: c.label,
	},
	separator: {
		marginLeft: 45,
		// erase the gap in the bar caused by the separators' block-ness
		marginTop: -1,
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
	let {width: windowWidth} = useWindowDimensions()
	let insets = useSafeAreaInsets()

	const currentDay = momentToDayOfWeek(now)

	let {selectedDay} = useBusDay()
	let dayToShow = selectedDay ?? currentDay

	const momentForSelectedDay = createMomentForDay(now, dayToShow)

	let {schedule, subtitle, currentBusIteration, parkedStopIndex, status} = deriveFromProps({
		line,
		now: momentForSelectedDay,
	})

	let busTarget = findBusTarget(
		schedule,
		{status, index: currentBusIteration, parkedStopIndex},
		momentForSelectedDay,
	)

	// In landscape on a notched iPhone, an inset-grouped List insets its card
	// by the safe-area inset plus SECTION_HORIZONTAL_INSET, not just the
	// constant, so the hosted view has to subtract both or its content
	// overflows the card.
	let hostedWidth = windowWidth - 2 * SECTION_HORIZONTAL_INSET - insets.left - insets.right

	let timetable = schedule.timetable

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				{line.notice ? (
					<Section>
						<VStack alignment="leading" spacing={4}>
							<SwiftUIText modifiers={[font({weight: 'semibold'})]}>About {line.line}</SwiftUIText>
							<SwiftUIText
								modifiers={[
									font({textStyle: 'subheadline'}),
									foregroundStyle(c.secondaryLabel),
									frame({maxWidth: Infinity, alignment: 'leading'}),
								]}
							>
								{line.notice}
							</SwiftUIText>
						</VStack>
					</Section>
				) : null}

				<Section
					footer={<SwiftUIText>{BUS_FOOTER_MESSAGE}</SwiftUIText>}
					title={scheduleSectionTitle({selectedDay, subtitle})}
				>
					{/* Zeroed insets and no separator, so the progress bar runs to
					    the card's own edges. */}
					<VStack
						modifiers={[
							listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 0}),
							listRowSeparator('hidden'),
						]}
					>
						<RNHostView matchContents={true}>
							<View style={{width: hostedWidth}}>
								{timetable.length === 0
									? EMPTY_SCHEDULE_MESSAGE
									: timetable.map((item, index) => (
											// oxlint-disable-next-line react/no-array-index-key -- a loop route visits a stop twice
											<React.Fragment key={`${item.name}-${index}`}>
												{index > 0 ? <BusLineSeparator /> : null}
												<TouchableOpacity
													onPress={() => {
														router.push({
															pathname: '/BusRouteDetail',
															params: {line: line.line, day: dayToShow, stopName: item.name},
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
						</RNHostView>
					</VStack>
				</Section>
			</List>
		</Host>
	)
}
