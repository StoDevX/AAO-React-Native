import * as React from 'react'
import {useRouter} from 'expo-router'

import {
	CalendarPicker,
	type SourcedEvent,
	useCalendarSources,
	useMergedEvents,
} from '@frogpond/ccc-calendar'
import {timezone} from '@frogpond/constants'
import {EventList} from '@frogpond/event-list'
import {useMomentTimer} from '@frogpond/timer'

import {STOLAF_POWERED_BY} from '../../source/features/calendar/constants'

export default function CalendarPage(): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	let {enabled} = useCalendarSources()
	let {events, failed, isRefetching, refetchAll} = useMergedEvents(enabled)
	let eventListRef = React.useRef<EventList.EventListHandle>(null)

	let onPressEvent = (entry: SourcedEvent) => {
		router.push({
			pathname: '/EventDetail',
			params: {source: entry.sourceId, eventKey: entry.key},
		})
	}

	let onTodayPress = React.useCallback(() => {
		eventListRef.current?.scrollToToday()
	}, [])

	return (
		<>
			<EventList.EventList
				ref={eventListRef}
				events={events}
				failed={failed}
				now={now}
				onPressEvent={onPressEvent}
				onRefresh={refetchAll}
				poweredBy={STOLAF_POWERED_BY}
				refreshing={isRefetching}
				sources={enabled}
			/>
			<CalendarPicker onTodayPress={onTodayPress} />
		</>
	)
}
