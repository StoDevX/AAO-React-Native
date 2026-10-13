import * as React from 'react'
import {Stack} from 'expo-router'
import {requiresSection} from '../../../source/features/campus/section-gate'

/**
 * The event sheet's own navigation stack, holding the header that carries its
 * Close and Share buttons.
 *
 * The title is blank: the event's name leads the body instead, beside the
 * calendar's colour bar, the way Calendar.app's sheet sets it.
 */
function EventDetailLayout(): React.ReactNode {
	return <Stack screenOptions={{title: ''}} />
}

export default requiresSection(
	'calendar',
	{title: 'Calendar', noun: 'a calendar', systemImage: 'calendar'},
	EventDetailLayout,
)
