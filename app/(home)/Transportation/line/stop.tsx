import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'

import type {Moment} from 'moment-timezone'

import {busLineOptions} from '../../../../source/features/transportation/bus/query'
import {createMomentForDay} from '../../../../source/features/transportation/bus/components/days'
import type {
	DayOfWeek,
	BusTimetableEntry,
	UnprocessedBusLine,
} from '../../../../source/features/transportation/bus/types'
import {
	findBusStopStatus as findStopStatus,
	type BusStateEnum,
	type BusStopStatusEnum,
} from '../../../../source/features/transportation/bus/lib'
import {useLineState} from '../../../../source/features/transportation/bus/use-line-state'
import {formatDeparture} from '../../../../source/features/transportation/bus/components/times'
import {TimetableRow} from '../../../../source/features/transportation/bus/components/timetable-row'
import {BUS_FOOTER_MESSAGE} from '../../../../source/features/transportation/bus/constants'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

type Props = {
	stop: BusTimetableEntry
	line: UnprocessedBusLine
	/**
	 * The moment the stop was resolved for -- the picked day, or the clock when
	 * the reader is following it. The same one the rest of the page reads, so
	 * the statuses below describe the day on screen.
	 */
	now: Moment
	status: BusStateEnum
	currentBusIteration: number | null
	subtitle: string
}

function BusStopDetail(props: Props): React.ReactNode {
	let {stop, line, now, status, currentBusIteration, subtitle} = props

	let departureTimes = stop.departures.filter(Boolean)

	// SwiftUI colors want strings; the feed gives hex, but the type is RN's
	// wider ColorValue.
	let barColor = String(line.colors.bar)
	let currentStopColor = String(line.colors.dot)

	let rows: React.ReactNode

	if (departureTimes.length === 0) {
		let stopStatus = findStopStatus({
			stop,
			busStatus: status,
			departureIndex: currentBusIteration,
			now,
		})
		let detail = 'No departure times available'

		rows = (
			<TimetableRow
				accessibilityLabel={`${stop.name}, ${detail}`}
				barColor={barColor}
				currentStopColor={currentStopColor}
				detail={detail}
				isFirstRow={true}
				isLastRow={true}
				stopStatus={stopStatus}
				title={stop.name}
			/>
		)
	} else {
		const getTimeStatus = (departureTime: Moment | null): BusStopStatusEnum => {
			if (!departureTime) return 'skip'

			if (now.isAfter(departureTime, 'minute')) {
				return 'after'
			} else if (now.isSame(departureTime, 'minute')) {
				return 'at'
			} else {
				return 'before'
			}
		}

		rows = departureTimes.map((time, index) => {
			let title = formatDeparture(time)

			return (
				<TimetableRow
					// oxlint-disable-next-line react/no-array-index-key -- position in the route is the stop's identity
					key={index}
					accessibilityLabel={title}
					barColor={barColor}
					currentStopColor={currentStopColor}
					isFirstRow={index === 0}
					isLastRow={index === departureTimes.length - 1}
					stopStatus={getTimeStatus(time)}
					title={title}
				/>
			)
		})
	}

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section
					footer={<Text>{BUS_FOOTER_MESSAGE}</Text>}
					title={`${stop.name} — ${subtitle}`.toUpperCase()}
				>
					{rows}
				</Section>
			</List>
		</Host>
	)
}

/**
 * The page once its line has arrived. One clock drives the whole screen: the
 * day the reader picked resolves the stop, and the statuses drawn against that
 * stop are read from the same moment, so the two always describe the same day.
 */
function BusStopForLine({
	line,
	now,
	stopName,
}: {
	line: UnprocessedBusLine
	now: Moment
	stopName: string
}): React.ReactNode {
	let {subtitle, status, schedule, currentBusIteration} = useLineState({line, now})

	let screenTitle = <Stack.Title>{`${line.line} Schedule`}</Stack.Title>
	let stop = schedule.timetable.find((entry) => entry.name === stopName)

	if (!stop) {
		return (
			<>
				{screenTitle}
				<NoticeView text={`Could not find the stop "${stopName}".`} />
			</>
		)
	}

	return (
		<>
			{screenTitle}
			<BusStopDetail
				currentBusIteration={currentBusIteration}
				line={line}
				now={now}
				status={status}
				stop={stop}
				subtitle={subtitle}
			/>
		</>
	)
}

export default function BusStopPage(): React.ReactNode {
	let {
		line: lineName,
		day,
		stopName,
	} = useLocalSearchParams<{
		line: string
		day: DayOfWeek | ''
		stopName: string
	}>()

	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	let {data: line, isLoading, error, refetch} = useQuery(busLineOptions(lineName))

	let screenTitle = <Stack.Title>{line ? `${line.line} Schedule` : ''}</Stack.Title>

	if (isLoading) {
		return (
			<>
				{screenTitle}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screenTitle}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!line) {
		return (
			<>
				{screenTitle}
				<NoticeView text={`Could not find the "${lineName}" bus line.`} />
			</>
		)
	}

	// An empty day means the caller was following the clock, so today it is.
	let momentForDay = day ? createMomentForDay(now, day) : now

	return <BusStopForLine line={line} now={momentForDay} stopName={stopName} />
}
