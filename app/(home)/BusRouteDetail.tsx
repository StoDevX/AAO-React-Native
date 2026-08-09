import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import {BusRouteDetail as BusRouteDetailView} from '../../source/views/transportation/bus/detail'
import {busLineOptions} from '../../source/views/transportation/bus/query'
import {deriveFromProps} from '../../source/views/transportation/bus/line'
import {createMomentForDay} from '../../source/views/transportation/bus/components/day-picker'
import type {DayOfWeek} from '../../source/views/transportation/bus/types'
import {LoadingView, NoticeView} from '@frogpond/notice'

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

	let {
		data: line,
		isLoading,
		error,
		refetch,
	} = useQuery(busLineOptions(lineName))

	let screen = (
		<Stack.Screen options={{title: line ? `${line.line} Schedule` : ''}} />
	)

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
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
				{screen}
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
				{screen}
				<NoticeView text={`Could not find the stop "${stopName}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<BusRouteDetailView line={line} stop={stop} subtitle={subtitle} />
		</>
	)
}
