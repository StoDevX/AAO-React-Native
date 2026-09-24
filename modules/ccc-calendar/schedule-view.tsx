import {EventList, type CalendarSource} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {NoticeView, listState} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'
import {UseQueryResult, onlineManager} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import * as React from 'react'
import type {SourcedEvent} from './sources'

type Props = {
	query: UseQueryResult<SourcedEvent[]>
	onPressEvent: (event: EventType) => void
}

// KSTO's and KRLX's schedules are broadcast schedules, not campus calendars --
// they aren't part of the calendar picker and never will be. So this screen
// draws one query in one accent colour: no picker and no merge.
const SOURCES: CalendarSource[] = [{id: 'schedule', title: 'the schedule', color: c.systemBlue}]

/** Said in place of the list while a query with nothing saved waits for a network. */
const OFFLINE_MESSAGE = 'You’re offline. The schedule will load once you’re back online.'

export function ScheduleView(props: Props): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000})
	let {data, error, isError, isPending, isPaused, isRefetching, refetch} = props.query

	let state = listState({
		hasData: data !== undefined,
		isError,
		isPending,
		isPaused,
		isOnline: onlineManager.isOnline(),
	})

	if (state === 'error') {
		let message = error instanceof Error ? error.message : String(error)
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${message}`}
			/>
		)
	}

	return (
		<EventList.EventList
			events={data ?? []}
			// A failed refresh keeps the saved schedule, with a note above it.
			failed={isError ? SOURCES : []}
			isLoading={state === 'loading'}
			message={state === 'offline' ? OFFLINE_MESSAGE : undefined}
			now={now}
			onPressEvent={(entry) => props.onPressEvent(entry.event)}
			onRefresh={refetch}
			refreshing={isRefetching}
			sources={SOURCES}
		/>
	)
}
