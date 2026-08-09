import * as React from 'react'
import {useRouter} from 'expo-router'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import {useQuery} from '@tanstack/react-query'
import {EventType} from '@frogpond/event-type'

function eventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

export function KSTOScheduleView(): React.ReactNode {
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
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
			query={useQuery(namedCalendarOptions('ksto-schedule', {eventMapper}))}
		/>
	)
}

export function KRLXScheduleView(): React.ReactNode {
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
		<CccCalendarView
			onPressEvent={onPressEvent}
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
			query={useQuery(namedCalendarOptions('krlx-schedule', {eventMapper}))}
		/>
	)
}
