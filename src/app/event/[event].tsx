import React from 'react'
import {Platform} from 'react-native'

/* eslint-disable @typescript-eslint/no-require-imports -- platform-specific conditional import */
const EventDetailView =
	Platform.OS === 'ios'
		? require('@frogpond/event-list/event-detail-ios').EventDetail
		: require('@frogpond/event-list/event-detail-android').EventDetail
/* eslint-enable @typescript-eslint/no-require-imports */

export default function EventDetailScreen(): React.ReactNode {
	return <EventDetailView />
}
