import * as React from 'react'
import {CccCalendarView, useNamedCalendar} from '@frogpond/ccc-calendar'
import {Stack} from 'expo-router'

export default function CalendarTabStOlaf() {
	return (
		<>
			<Stack.Screen options={{title: 'Cal'}} />
			<CccCalendarView
				poweredBy={{
					title: 'Powered by the St. Olaf calendar',
					href: 'https://wp.stolaf.edu/calendar/',
				}}
				query={useNamedCalendar('stolaf')}
			/>
		</>
	)
}
