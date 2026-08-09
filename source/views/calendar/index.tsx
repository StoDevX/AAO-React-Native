import * as React from 'react'
import {useRouter} from 'expo-router'

import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

export const STOLAF_POWERED_BY = {
	title: 'Powered by the St. Olaf calendar',
	href: 'https://wp.stolaf.edu/calendar/',
}

export const NORTHFIELD_POWERED_BY = {
	title: 'Powered by VisitingNorthfield.com',
	href: 'https://visitingnorthfield.com/events/calendar/',
}

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
			poweredBy={STOLAF_POWERED_BY}
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
			poweredBy={NORTHFIELD_POWERED_BY}
			query={useQuery(namedCalendarOptions('northfield'))}
		/>
	)
}
