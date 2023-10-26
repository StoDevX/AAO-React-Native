import {Platform} from 'react-native'

import {EventType} from '@frogpond/event-type'

import {
	EventDetail as AndroidEventDetail,
	NavigationOptions as AndroidDetailNavigationOptions,
} from './event-detail-android'
import {
	EventDetail as IosEventDetail,
	NavigationOptions as IOSDetailNavigationOptions,
} from './event-detail-ios'
import {PoweredBy} from './types'

export const EventDetailNavigationOptions =
	Platform.OS === 'ios'
		? IOSDetailNavigationOptions
		: AndroidDetailNavigationOptions

export const EventDetail =
	Platform.OS === 'ios' ? IosEventDetail : AndroidEventDetail

export const NavigationKey = 'EventDetail' as const
export type ParamList = {event: EventType; poweredBy: PoweredBy}
