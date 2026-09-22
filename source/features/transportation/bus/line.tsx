import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {DayOfWeek, UnprocessedBusLine} from './types'
import {
	busPropsForRow,
	collapseEarlierStops,
	findBusStopStatus,
	findBusTarget,
	findClosure,
	findRemainingDeparturesForStop,
} from './lib'
import {useLineState} from './use-line-state'
import type {Moment} from 'moment-timezone'
import * as c from '@frogpond/colors'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {frame, listStyle} from '@expo/ui/swift-ui/modifiers'
import {BUS_FOOTER_MESSAGE} from './constants'
import {momentToDayOfWeek, createMomentForDay} from './components/days'
import {formatDepartures} from './components/times'
import {CollapsedStopsRow, TimetableRow} from './components/timetable-row'

/**
 * How many of a stop's remaining departures a row shows. Three fit on one
 * line; every row then stands the same height, which the rail's bus glyph
 * relies on.
 */
const DEPARTURES_PER_ROW = 3

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

	let {schedule, currentBusIteration, parkedStopIndex, status} = useLineState({
		line,
		now: momentForSelectedDay,
	})

	// Named separately from `schedule` so the empty state can say why: the
	// bus schedule found for a closure day is empty for the same reason a
	// schedule not found at all is, but only one of those has a holiday to
	// name.
	let closure = findClosure(line.schedules, momentForSelectedDay)

	// The timetable opens on where the bus is, with the stops behind it folded
	// away.
	let [expanded, setExpanded] = React.useState(false)

	let busTarget = findBusTarget(
		schedule,
		{status, index: currentBusIteration, parkedStopIndex},
		momentForSelectedDay,
	)

	let timetable = schedule.timetable

	let {firstVisibleIndex, hiddenCount} = collapseEarlierStops({
		targetIndex: busTarget?.targetIndex ?? null,
		expanded,
	})

	// One row's measured height, which every row then uses to place the bus.
	// The set is skipped when the value has not changed: the measurement
	// fires on layout passes the rows do not care about, and only a new
	// height is worth a render.
	let [rowHeight, setRowHeight] = React.useState<number | null>(null)

	let recordRowHeight = React.useCallback((height: number) => {
		setRowHeight((known) => (known === height ? known : height))
	}, [])

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
						<Text modifiers={[frame({maxWidth: Infinity, alignment: 'leading'})]}>
							{line.notice}
						</Text>
					</Section>
				) : null}

				<Section footer={<Text>{BUS_FOOTER_MESSAGE}</Text>} title="Stops">
					{hiddenCount > 0 ? (
						<CollapsedStopsRow
							barColor={barColor}
							count={hiddenCount}
							onPress={() => setExpanded(true)}
						/>
					) : null}

					{timetable.length === 0 ? (
						<ContentUnavailableView
							systemImage="bus"
							title={
								closure
									? `This line is not running today — ${closure.name}.`
									: 'This line is not running today.'
							}
						/>
					) : (
						timetable.map((stop, index) => {
							if (index < firstVisibleIndex) {
								return null
							}

							let {busFraction, busAtStop} = busPropsForRow(busTarget, index)
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
								}).slice(0, DEPARTURES_PER_ROW),
							)

							return (
								<TimetableRow
									// oxlint-disable-next-line react/no-array-index-key -- a loop route visits a stop twice
									key={`${stop.name}-${index}`}
									accessibilityLabel={`${stop.name}, ${times}`}
									barColor={barColor}
									busAtStop={busAtStop}
									busFraction={busFraction}
									currentStopColor={currentStopColor}
									detail={times}
									isFirstRow={index === 0}
									isLastRow={index === timetable.length - 1}
									onHeight={index === firstVisibleIndex ? recordRowHeight : undefined}
									onPress={() => onPressStop(stop.name)}
									rowHeight={rowHeight}
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
