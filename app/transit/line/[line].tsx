import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {BusLine} from '../../../source/features/transit/bus/line'
import {busLineOptions} from '../../../source/features/transit/bus/query'
import {useLegacyCampus} from '../../../source/features/campus/store'
import {DAYS_OF_WEEK} from '../../../source/features/transit/bus/components/days'
import type {DayOfWeek} from '../../../source/features/transit/bus/types'

export default function BusLinePage(): React.ReactNode {
	let campus = useLegacyCampus()
	let {line: lineName} = useLocalSearchParams<{line: string}>()
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})

	/**
	 * `null` rather than today's weekday so the toolbar menu can label itself
	 * without a timer, and so the schedule rolls over at midnight on its own --
	 * until a day is picked. The menu offers only the seven weekdays, so once
	 * set this stays pinned to that day.
	 *
	 * Held here rather than in a store: the pick is a way of looking around
	 * inside one sheet, and it should not outlive it.
	 */
	let [selectedDay, setSelectedDay] = React.useState<DayOfWeek | null>(null)

	let {data: line, isLoading, error, refetch} = useQuery(busLineOptions(lineName, campus))

	let label = DAYS_OF_WEEK.find(({day}) => day === selectedDay)?.label ?? 'Today'

	let chrome = (
		<>
			<Stack.Title>{lineName}</Stack.Title>
			<SheetCloseButton />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu title="Pick a schedule">
					<Stack.Toolbar.Icon sf="calendar" />
					<Stack.Toolbar.Label>{label}</Stack.Toolbar.Label>
					{DAYS_OF_WEEK.map(({day, label: dayLabel}) => (
						<Stack.Toolbar.MenuAction
							key={day}
							isOn={selectedDay === day}
							onPress={() => setSelectedDay(day)}
						>
							{dayLabel}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
		</>
	)

	if (isLoading) {
		return (
			<>
				{chrome}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{chrome}
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (!line) {
		return (
			<>
				{chrome}
				<NoticeView
					description={`No bus line is called “${lineName}”.`}
					systemImage="bus"
					title="Line Not Found"
				/>
			</>
		)
	}

	return (
		<>
			{chrome}
			<BusLine
				line={line}
				now={now}
				onPressStop={(stopName) => {
					router.navigate({
						pathname: '/transit/line/stop',
						params: {line: lineName, day: selectedDay ?? '', stopName},
					})
				}}
				selectedDay={selectedDay}
			/>
		</>
	)
}
