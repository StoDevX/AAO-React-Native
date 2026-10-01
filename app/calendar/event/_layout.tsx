import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The event sheet's own navigation stack, holding the header that carries its
 * Close and Share buttons.
 *
 * The title is blank: the event's name leads the body instead, beside the
 * calendar's colour bar, the way Calendar.app's sheet sets it.
 */
export default function EventDetailLayout(): React.ReactNode {
	return <Stack screenOptions={{title: ''}} />
}
