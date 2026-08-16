import * as React from 'react'
import {useEffect, useState} from 'react'
import {FlatList, StyleSheet, Text} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import type {Moment} from 'moment-timezone'

import {busLineOptions} from '../../source/features/transportation/bus/query'
import {deriveFromProps} from '../../source/features/transportation/bus/line'
import {createMomentForDay} from '../../source/features/transportation/bus/components/day-picker'
import type {
	DayOfWeek,
	BusTimetableEntry,
	UnprocessedBusLine,
	BusSchedule,
} from '../../source/features/transportation/bus/types'
import {
	BusStateEnum,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
	findBusStopStatus as findStopStatus,
	type BusStopStatusEnum,
} from '../../source/features/transportation/bus/lib'
import {ScheduleTimes} from '../../source/features/transportation/bus/components/times'
import {ProgressChunk} from '../../source/features/transportation/bus/components/progress-chunk'
import {BUS_FOOTER_MESSAGE} from '../../source/features/transportation/bus/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {ListFooter, ListRow, ListSectionHeader, Detail, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {Column} from '@frogpond/layout'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.secondarySystemGroupedBackground,
	},
	timeRow: {
		flexDirection: 'row',
	},
	noTimesText: {
		color: c.tertiaryLabel,
		fontStyle: 'italic',
		textAlign: 'center',
		padding: 20,
	},
	internalPadding: {
		paddingVertical: 12,
	},
	skippingStopTitle: {
		color: c.tertiaryLabel,
	},
	passedStopTitle: {
		color: c.secondaryLabel,
	},
	atStopTitle: {
		fontWeight: '600',
	},
})

type Props = {
	stop: BusTimetableEntry
	line: UnprocessedBusLine
	now: Moment
	subtitle: string
}

function BusStopDetailInternal(props: Props): React.ReactNode {
	let {stop, line, now, subtitle} = props

	let [_, setSchedule] = useState<BusSchedule | null>(null)
	let [currentBusIteration, setCurrentBusIteration] = useState<number | null>(null)
	let [status, setStatus] = useState<BusStateEnum>('none')

	useEffect(() => {
		let processedLine = processBusLine(line, now)
		let scheduleForToday = getScheduleForNow(processedLine.schedules, now)
		let {index, status: currentStatus} = getCurrentBusIteration(scheduleForToday, now)

		setSchedule(scheduleForToday)
		setStatus(currentStatus)
		setCurrentBusIteration(index)
	}, [line, now])

	let departureTimes = stop.departures.filter(Boolean)
	let stopStatus = findStopStatus({
		stop,
		busStatus: status,
		departureIndex: currentBusIteration,
		now,
	})

	let headerElement = <ListSectionHeader subtitle={subtitle} title={stop.name} />

	let rowTextStyle = [
		stopStatus === 'skip' && styles.skippingStopTitle,
		stopStatus === 'after' && styles.passedStopTitle,
		stopStatus === 'at' && styles.atStopTitle,
	]

	if (departureTimes.length === 0) {
		let emptyRowElement = (
			<ListRow fullHeight={true} fullWidth={true} style={styles.timeRow}>
				<ProgressChunk
					barColor={line.colors.bar}
					currentStopColor={line.colors.dot}
					isFirstChunk={true}
					isLastChunk={true}
					stopStatus={stopStatus}
				/>
				<Column flex={1} style={styles.internalPadding}>
					<Title bold={false} style={rowTextStyle}>
						{stop.name}
					</Title>
					<Detail lines={1}>
						<Text style={styles.noTimesText}>No departure times available</Text>
					</Detail>
				</Column>
			</ListRow>
		)

		return (
			<FlatList
				ListFooterComponent={<ListFooter title={BUS_FOOTER_MESSAGE} />}
				ListHeaderComponent={headerElement}
				contentInsetAdjustmentBehavior="automatic"
				data={[emptyRowElement]}
				keyExtractor={(item, index) => `${item.key}-${index}`}
				renderItem={({item}) => item}
				style={styles.container}
			/>
		)
	}

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

	let timeRows = departureTimes.map((time, index) => {
		let timeStatus = getTimeStatus(time)

		let timeRowTextStyle = [
			timeStatus === 'skip' && styles.skippingStopTitle,
			timeStatus === 'after' && styles.passedStopTitle,
			timeStatus === 'at' && styles.atStopTitle,
		]

		return (
			<ListRow key={index} fullHeight={true} fullWidth={true} style={styles.timeRow}>
				<ProgressChunk
					barColor={line.colors.bar}
					currentStopColor={line.colors.dot}
					isFirstChunk={index === 0}
					isLastChunk={index === departureTimes.length - 1}
					stopStatus={timeStatus}
				/>
				<Column flex={1} style={styles.internalPadding}>
					<Title bold={false} style={timeRowTextStyle}>
						<ScheduleTimes times={[time]} />
					</Title>
				</Column>
			</ListRow>
		)
	})

	return (
		<FlatList
			ItemSeparatorComponent={undefined}
			ListFooterComponent={<ListFooter title={BUS_FOOTER_MESSAGE} />}
			ListHeaderComponent={headerElement}
			contentInsetAdjustmentBehavior="automatic"
			data={timeRows}
			keyExtractor={(item, index) => `${item.key}-${index}`}
			renderItem={({item}) => item}
			style={styles.container}
		/>
	)
}

type BusRouteDetailProps = {
	stop: BusTimetableEntry
	line: UnprocessedBusLine
	subtitle: string
}

function BusRouteDetailView({stop, line, subtitle}: BusRouteDetailProps): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	return <BusStopDetailInternal line={line} now={now} stop={stop} subtitle={subtitle} />
}

export default function BusRouteDetailPage(): React.ReactNode {
	let {
		line: lineName,
		day,
		stopName,
	} = useLocalSearchParams<{
		line: string
		day: DayOfWeek
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
					text={`A problem occured while loading: ${
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

	let momentForDay = createMomentForDay(now, day)
	let {subtitle, schedule} = deriveFromProps({line, now: momentForDay})
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
			<BusRouteDetailView line={line} stop={stop} subtitle={subtitle} />
		</>
	)
}
