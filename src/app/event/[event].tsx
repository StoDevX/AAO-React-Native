import React from 'react'
import {Platform} from 'react-native'

import {EventDetail as EventDetailIos} from '@frogpond/event-list/event-detail-ios'
import {EventDetail as EventDetailAndroid} from '@frogpond/event-list/event-detail-android'

const EventDetailView =
	Platform.OS === 'ios' ? EventDetailIos : EventDetailAndroid

export default function EventDetailScreen(): React.ReactNode {
	return <EventDetailView />
}
