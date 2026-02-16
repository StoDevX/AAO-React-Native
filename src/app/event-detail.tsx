import * as React from 'react'
import {Stack} from 'expo-router'
import {EventDetail as EventDetailView} from '../../modules/event-list/event-detail'

export default function EventDetailRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Event'}} />
			<EventDetailView />
		</>
	)
}
