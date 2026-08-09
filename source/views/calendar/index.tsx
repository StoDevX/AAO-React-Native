import * as React from 'react'
import {useRouter} from 'expo-router'

import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

export function StOlafCalendarView(): React.ReactNode {
	let router = useRouter()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			router.push({
				pathname: '/EventDetail',
				params: {source: 'stolaf', eventKey: eventKey(event)},
			})
		},
		[router],
	)

	return (
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the St. Olaf calendar',
				href: 'https://wp.stolaf.edu/calendar/',
			}}
			query={useQuery(namedCalendarOptions('stolaf'))}
		/>
	)
}

export function NorthfieldCalendarView(): React.ReactNode {
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
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}
