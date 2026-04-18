import * as React from 'react'
import {CccCalendarView, namedCalendarOptions} from '@frogpond/ccc-calendar'
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
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
			query={useQuery(namedCalendarOptions('ksto-schedule', {eventMapper}))}
		/>
	)
}

export function KRLXScheduleView(): React.ReactNode {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
			query={useQuery(namedCalendarOptions('krlx-schedule', {eventMapper}))}
		/>
	)
}
