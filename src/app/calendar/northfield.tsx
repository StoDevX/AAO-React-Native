import * as React from 'react'
import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'

export default function CalendarTabNorthfield() {
	return (
		<CccCalendarView
			poweredBy={{
				title: 'Powered by VisitingNorthfield.com',
				href: 'https://visitingnorthfield.com/events/calendar/',
			}}
			query={useNamedCalendar('northfield')}
		/>
	)
}
