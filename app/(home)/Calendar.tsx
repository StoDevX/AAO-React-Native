import * as React from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {STOLAF_POWERED_BY} from '../../source/features/calendar/constants'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {enabled} = useCalendarSources()
	let {events, failed, isRefetching, refetchAll} = useMergedEvents(enabled)

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	return (
		<>
			<EventList.EventList
				events={events}
				failed={failed}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				poweredBy={STOLAF_POWERED_BY}
				refreshing={isRefetching}
				sources={enabled}
			/>
			<CalendarPicker />
		</>
	)
}
