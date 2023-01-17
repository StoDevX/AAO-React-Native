import * as React from 'react'
import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'
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

export function KSTOScheduleView(): JSX.Element {
	return (
		<CccCalendarView
			query={useNamedCalendar('ksto-schedule', {eventMapper})}
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
		/>
	)
}

export function KRLXScheduleView(): JSX.Element {
	return (
		<CccCalendarView
			query={useNamedCalendar('krlx-schedule', {eventMapper})}
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
		/>
	)
}
