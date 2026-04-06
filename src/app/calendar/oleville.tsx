import * as React from 'react'
import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'

export default function CalendarTabOleville(): React.JSX.Element {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by the Oleville calendar',
				href: 'https://oleville.com/events/',
			}}
			query={useNamedCalendar('oleville')}
		/>
	)
}
