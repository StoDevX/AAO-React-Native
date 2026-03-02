import React from 'react'
import {Platform} from 'react-native'

const EventDetailView =
	Platform.OS === 'ios'
		? require('@frogpond/event-list/event-detail-ios').EventDetail
		: require('@frogpond/event-list/event-detail-android').EventDetail

export default function EventDetailScreen(): React.ReactNode {
	return <EventDetailView />
}
