import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

import {KRLX_POWERED_BY} from '../../source/features/streaming/radio/constants'

function eventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

export default function KRLXSchedulePage(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'krlx-schedule', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<>
			<Stack.Screen options={{title: 'KRLX Schedule'}} />
			<CccCalendarView
				onPressEvent={onPressEvent}
				poweredBy={KRLX_POWERED_BY}
				query={useQuery(namedCalendarOptions('krlx-schedule', {eventMapper}))}
			/>
		</>
	)
}
