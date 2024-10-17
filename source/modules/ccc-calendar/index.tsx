import {EventList} from '../event-list'
import type {EventType} from '../event-type'
import {NoticeView} from '../notice'
import {useMomentTimer} from '../timer'
import {UseQueryResult} from '@tanstack/react-query'
import * as React from 'react'

export {
	useNamedCalendar,
	useGoogleCalendar,
	useReasonCalendar,
	useIcsCalendar,
} from './query'

interface Props {
	detailView?: string
	poweredBy: string
	poweredByUrl: string
	query: UseQueryResult<EventType[]>
}

export function CccCalendarView(props: Props): React.JSX.Element {
	let {now} = useMomentTimer({intervalMs: 60000})
	let {isError, refetch, data = [], isRefetching} = props.query

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${String(props.query.error)}`}
			/>
		)
	}

	return (
		<EventList.EventList
			detailView={props.detailView}
			events={data}
			now={now}
			onRefresh={refetch}
			poweredBy={props.poweredBy}
			poweredByUrl={props.poweredByUrl}
			refreshing={isRefetching}
		/>
	)
}
