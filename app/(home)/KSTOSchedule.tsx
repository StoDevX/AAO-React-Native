import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {namedCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

import {eventMapper, KSTO_POWERED_BY} from '../../source/features/streaming/radio/constants'

export default function KSTOSchedulePage(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'ksto-schedule', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<>
			<Stack.Title>KSTO Schedule</Stack.Title>
			<ScheduleView
				onPressEvent={onPressEvent}
				poweredBy={KSTO_POWERED_BY}
				query={useQuery(namedCalendarOptions('ksto-schedule', {eventMapper}))}
			/>
		</>
	)
}
