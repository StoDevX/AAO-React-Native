import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {scheduleCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

import {SUMO_SOURCE_ID, sumoEventMapper} from '../source/features/carleton/constants'

export default function CarletonSumoPage(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.navigate({
				pathname: '/calendar/event',
				params: {source: SUMO_SOURCE_ID, eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<>
			<Stack.Title>SUMO</Stack.Title>
			<ScheduleView
				onPressEvent={onPressEvent}
				query={useQuery(scheduleCalendarOptions(SUMO_SOURCE_ID, {eventMapper: sumoEventMapper}))}
			/>
		</>
	)
}
