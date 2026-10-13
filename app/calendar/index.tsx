import * as React from 'react'

import {CalendarScreen} from '../../source/features/calendar/calendar-screen'
import {requiresSection} from '../../source/features/campus/section-gate'

function CalendarPage(): React.ReactNode {
	return <CalendarScreen />
}

export default requiresSection(
	'calendar',
	{title: 'Calendar', noun: 'a calendar', systemImage: 'calendar'},
	CalendarPage,
)
