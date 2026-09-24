import {EventList, type CalendarSource} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {NoticeView} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'
import {UseQueryResult} from '@tanstack/react-query'
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
export const OFFLINE_MESSAGE = 'You’re offline. The schedule will load once you’re back online.'

export function ScheduleView(props: Props): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000})
	let {isError, isPending, fetchStatus, refetch, data, isRefetching} = props.query

	// A failed refresh leaves the saved schedule in `data`; only a failure with
	// nothing to fall back on replaces the list.
	if (isError && !data) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${props.query.error}`}
			/>
		)
	}

	// With no network, React Query pauses the fetch rather than failing it, so
	// without this the screen would claim nothing is scheduled for as long as
	// the device stays offline.
	let offline = isPending && fetchStatus === 'paused'

	return (
		<EventList.EventList
			events={data ?? []}
			failed={isError ? SOURCES : []}
			isLoading={isPending}
			message={offline ? OFFLINE_MESSAGE : undefined}
			now={now}
			onPressEvent={(entry) => props.onPressEvent(entry.event)}
			onRefresh={refetch}
			refreshing={isRefetching}
			sources={SOURCES}
		/>
	)
}
