import {EventList, type PoweredBy} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {NoticeView} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'
import {UseQueryResult} from '@tanstack/react-query'
import * as React from 'react'
import type {SourcedEvent} from './sources'

export {namedCalendarOptions, namedCalendarEventOptions} from './query'

type Props = {
	poweredBy: PoweredBy
	query: UseQueryResult<SourcedEvent[]>
	onPressEvent: (event: EventType) => void
}

// Events carry their source id; this single-query view doesn't tint or
// merge, so it drops the tag.
export function CccCalendarView(props: Props): React.ReactNode {
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
			events={data.map((entry) => entry.event)}
			now={now}
			onPressEvent={props.onPressEvent}
			onRefresh={refetch}
			poweredBy={props.poweredBy}
			refreshing={isRefetching}
		/>
	)
}
