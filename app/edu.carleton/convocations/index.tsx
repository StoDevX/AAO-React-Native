import * as React from 'react'
import {useRouter} from 'expo-router'
import {scheduleCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

import {CONVOS_SOURCE_ID} from '../../../source/features/carleton/constants'

export default function UpcomingConvosPage(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.navigate({
				pathname: '/calendar/event',
				params: {source: CONVOS_SOURCE_ID, eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<ScheduleView
			onPressEvent={onPressEvent}
			query={useQuery(scheduleCalendarOptions(CONVOS_SOURCE_ID))}
		/>
	)
}
