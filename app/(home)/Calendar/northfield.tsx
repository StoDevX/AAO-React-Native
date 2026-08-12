import * as React from 'react'
import {useRouter} from 'expo-router'

import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

import {NORTHFIELD_POWERED_BY} from '../../../source/features/calendar/constants'

export default function NorthfieldCalendarPage(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'northfield', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={NORTHFIELD_POWERED_BY}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}
