import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'

import {CalendarScreen} from '../../source/features/calendar/calendar-screen'
import {requiresSection} from '../../source/features/campus/section-gate'

/**
 * One organization's events, as an org's detail screen opens them: the
 * calendar narrowed to `name`, in the Upcoming list, without touching the
 * reader's own calendar settings.
 */
function OrganizationCalendarPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()

	return (
		<>
			<Stack.Title>{name}</Stack.Title>
			<CalendarScreen organization={name} />
		</>
	)
}

export default requiresSection(
	'calendar',
	{title: 'Calendar', noun: 'a calendar', systemImage: 'calendar'},
	OrganizationCalendarPage,
)
