import {EventList, type CalendarSource, type PoweredBy} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {NoticeView} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'
import {UseQueryResult} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import * as React from 'react'
import type {SourcedEvent} from './sources'

type Props = {
	poweredBy: PoweredBy
	query: UseQueryResult<SourcedEvent[]>
	onPressEvent: (event: EventType) => void
}

// KSTO's and KRLX's schedules are broadcast schedules, not campus calendars --
// they aren't part of the calendar picker and never will be. So this screen
// draws one query in one accent colour: no picker, no merge, and no per-source
// failure list.
const SOURCES: CalendarSource[] = [{id: 'schedule', title: '', color: c.systemBlue, kind: 'remote'}]

export function ScheduleView(props: Props): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000})
	let {isError, refetch, data = [], isRefetching} = props.query

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${props.query.error}`}
			/>
		)
	}

	return (
		<EventList.EventList
			events={data}
			failed={[]}
			now={now}
			onPressEvent={(entry) => props.onPressEvent(entry.event)}
			onRefresh={refetch}
			poweredBy={props.poweredBy}
			refreshing={isRefetching}
			sources={SOURCES}
		/>
	)
}
