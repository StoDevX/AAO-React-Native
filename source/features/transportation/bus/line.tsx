import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {DayOfWeek, UnprocessedBusLine} from './types'
import {
	busPropsForRow,
	deriveLineState,
	findBusStopStatus,
	findBusTarget,
	findRemainingDeparturesForStop,
	scheduleSectionTitle,
} from './lib'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {font, foregroundStyle, frame, listStyle} from '@expo/ui/swift-ui/modifiers'
import {BUS_FOOTER_MESSAGE} from './constants'
import {momentToDayOfWeek, createMomentForDay} from './components/days'
import {formatDepartures} from './components/times'
import {TimetableRow} from './components/timetable-row'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

type Props = {
	line: UnprocessedBusLine
	now: Moment
	/** The day on screen, or `null` to follow the clock. */
	selectedDay: DayOfWeek | null
	onPressStop: (stopName: string) => void
}

export function BusLine(props: Props): React.ReactNode {
	let {line, now, selectedDay, onPressStop} = props

	const currentDay = momentToDayOfWeek(now)

	let dayToShow = selectedDay ?? currentDay

	const momentForSelectedDay = createMomentForDay(now, dayToShow)

	let {schedule, subtitle, currentBusIteration, parkedStopIndex, status} = deriveLineState({
		line,
		now: momentForSelectedDay,
	})

	let busTarget = findBusTarget(
		schedule,
		{status, index: currentBusIteration, parkedStopIndex},
		momentForSelectedDay,
	)

	let timetable = schedule.timetable

	// SwiftUI colors want strings; the feed gives hex, but the type is RN's
	// wider ColorValue.
	let barColor = String(line.colors.bar)
	let currentStopColor = String(line.colors.dot)

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				{line.notice ? (
					<Section>
						{/* The sheet's title already names the line, so the notice
						    stands alone. Stretched to the card's width, so a short
						    one sits at the leading edge rather than centring. */}
						<Text
							modifiers={[
								font({textStyle: 'subheadline'}),
								foregroundStyle(c.secondaryLabel),
								frame({maxWidth: Infinity, alignment: 'leading'}),
							]}
						>
							{line.notice}
						</Text>
					</Section>
				) : null}

				<Section
					footer={<Text>{BUS_FOOTER_MESSAGE}</Text>}
					title={scheduleSectionTitle({selectedDay, subtitle})}
				>
					{timetable.length === 0 ? (
						<ContentUnavailableView systemImage="bus" title="This line is not running today." />
					) : (
						timetable.map((stop, index) => {
							let {busProgress, busAtStop} = busPropsForRow(busTarget, index)
							let stopStatus = findBusStopStatus({
								stop,
								busStatus: status,
								departureIndex: currentBusIteration,
								now: momentForSelectedDay,
								busAtStop,
							})
							let times = formatDepartures(
								findRemainingDeparturesForStop({
									stop,
									busStatus: status,
									departureIndex: currentBusIteration,
								}),
							)

							return (
								<TimetableRow
									// oxlint-disable-next-line react/no-array-index-key -- a loop route visits a stop twice
									key={`${stop.name}-${index}`}
									accessibilityLabel={`${stop.name}, ${times}`}
									barColor={barColor}
									busAtStop={busAtStop}
									busProgress={busProgress}
									currentStopColor={currentStopColor}
									detail={times}
									isFirstRow={index === 0}
									isLastRow={index === timetable.length - 1}
									onPress={() => onPressStop(stop.name)}
									stopStatus={stopStatus}
									title={stop.name}
								/>
							)
						})
					)}
				</Section>
			</List>
		</Host>
	)
}
