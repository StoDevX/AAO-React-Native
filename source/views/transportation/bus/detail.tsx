import * as React from 'react'
import {useEffect, useState} from 'react'
import {FlatList, StyleSheet, Text} from 'react-native'

import {RouteProp, useRoute} from '@react-navigation/native'
import type {Moment} from 'moment-timezone'

import {ScheduleTimes} from './components/times'
import {ProgressChunk} from './components/progress-chunk'
import type {BusTimetableEntry, UnprocessedBusLine, BusSchedule} from './types'
import {RootStackParamList} from '../../../navigation/types'
import {
	BusStateEnum,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
	findBusStopStatus as findStopStatus,
	type BusStopStatusEnum,
} from './lib'

import {ListFooter, ListRow, ListSectionHeader} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useMomentTimer} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'
import {Column} from '@frogpond/layout'
import {Detail, Title} from '@frogpond/lists'
import {BUS_FOOTER_MESSAGE} from './constants'

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

function BusStopDetailInternal(props: Props): JSX.Element {
	let {stop, line, now, subtitle} = props

	let [_, setSchedule] = useState<BusSchedule | null>(null)
	let [currentBusIteration, setCurrentBusIteration] = useState<number | null>(
		null,
	)
	let [status, setStatus] = useState<BusStateEnum>('none')

	useEffect(() => {
		let processedLine = processBusLine(line, now)
		let scheduleForToday = getScheduleForNow(processedLine.schedules, now)
		let {index, status: currentStatus} = getCurrentBusIteration(
			scheduleForToday,
			now,
		)

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

	let headerElement = (
		<ListSectionHeader subtitle={subtitle} title={stop.name} />
	)

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
			<ListRow
				key={index}
				fullHeight={true}
				fullWidth={true}
				style={styles.timeRow}
			>
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
			data={timeRows}
			keyExtractor={(item, index) => `${item.key}-${index}`}
			renderItem={({item}) => item}
			style={styles.container}
		/>
	)
}

export function BusRouteDetail(): JSX.Element {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let route = useRoute<RouteProp<RootStackParamList, 'BusRouteDetail'>>()
	let {stop, line, subtitle} = route.params

	return (
		<BusStopDetailInternal
			line={line}
			now={now}
			stop={stop}
			subtitle={subtitle}
		/>
	)
}
