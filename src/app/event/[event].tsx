import React from 'react'
import {Platform} from 'react-native'

const EventDetailView = React.lazy(() =>
	Platform.OS === 'ios'
		? import('@frogpond/event-list/event-detail-ios').then((m) => ({
				default: m.EventDetail,
			}))
		: import('@frogpond/event-list/event-detail-android').then((m) => ({
				default: m.EventDetail,
			})),
)

export default function EventDetailScreen(): React.JSX.Element {
	return (
		<React.Suspense>
			<EventDetailView />
		</React.Suspense>
	)
}
