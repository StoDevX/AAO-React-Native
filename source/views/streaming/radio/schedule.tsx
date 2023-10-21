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
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
			query={useNamedCalendar('ksto-schedule', {eventMapper})}
		/>
	)
}

export function KRLXScheduleView(): JSX.Element {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
			query={useNamedCalendar('krlx-schedule', {eventMapper})}
		/>
	)
}
