import * as React from 'react'
import {useEffect, useState} from 'react'
import {FlatList, Platform, StyleSheet, Text, TouchableOpacity} from 'react-native'
import type {BusSchedule, UnprocessedBusLine} from './types'
import {
	BusStateEnum,
	getCurrentBusIteration,
	getScheduleForNow,
	processBusLine,
} from './lib'
import type {Moment} from 'moment-timezone'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import {Separator} from '@frogpond/separator'
import {BusStopRow} from './components/bus-stop-row'
import {ListFooter, ListRow, ListSectionHeader} from '@frogpond/lists'
import {InfoHeader} from '@frogpond/info-header'
import * as c from '@frogpond/colors'
import {useNavigation} from '@react-navigation/native'
import {BUS_FOOTER_MESSAGE} from './constants'

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
	openMap: () => unknown
}

function startsIn(now: Moment, start?: Moment | null) {
	if (!start) {
		return 'Error'
	}

	let nowCopy = now.clone()
	return `Starts ${nowCopy.seconds(0).to(start)}`
}

function deriveFromProps({line, now}: {line: UnprocessedBusLine; now: Moment}) {
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
		subtitle += ` (${now.format('dd h:mma')})`
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
	let [subtitle, setSubtitle] = useState<string>()
	let [currentBusIteration, setCurrentBusIteration] = useState<number | null>(
		null,
	)
	let [status, setStatus] = useState<BusStateEnum>('none')

	useEffect(() => {
		let {
			schedule: scheduleForToday,
			subtitle: scheduleSubtitle,
			currentBusIteration: busIteration,
			status: currentStatus,
		} = deriveFromProps({
			line,
			now,
		})
		setSchedule(scheduleForToday)
		setSubtitle(scheduleSubtitle)
		setStatus(currentStatus)
		setCurrentBusIteration(busIteration)
	}, [line, now])

	let INFO_EL = (
		<ListSectionHeader
			subtitle={subtitle}
			title={line.line}
			titleStyle={Platform.OS === 'android' ? {color: line.colors.bar} : null}
		/>
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
						navigation.navigate('BusRouteDetail', {stop: item, line})
					}}
				>
					<BusStopRow
						barColor={line.colors.bar}
						currentStopColor={line.colors.dot}
						departureIndex={currentBusIteration}
						isFirstRow={index === 0}
						isLastRow={timetable.length === 0 || index === timetable.length - 1}
						now={now}
						status={status}
						stop={item}
					/>
				</TouchableOpacity>
			)}
			style={styles.container}
		/>
	)
}
