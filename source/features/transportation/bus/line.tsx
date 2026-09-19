import * as React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import type {UnprocessedBusLine} from './types'
import {busPropsForRow, deriveFromProps, findBusTarget, scheduleSectionTitle} from './lib'
import type {Moment} from 'moment-timezone'
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
import {BUS_FOOTER_MESSAGE} from './constants'
import {momentToDayOfWeek, createMomentForDay} from './components/days'
import {useBusDay} from './store'
import {useTimetableWidth} from './use-timetable-width'

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

export function BusLine(props: Props): React.ReactNode {
	let {line, now} = props
	let router = useRouter()
	let hostedWidth = useTimetableWidth()

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
