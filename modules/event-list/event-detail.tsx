import {Platform} from 'react-native'

import {
	EventDetail as IosEventDetail,
	NavigationOptions as IOSDetailNavigationOptions,
} from './event-detail-ios'
import {
	EventDetail as AndroidEventDetail,
	NavigationOptions as AndroidDetailNavigationOptions,
} from './event-detail-android'

export const EventDetailNavigationOptions =
	Platform.OS === 'ios'
		? IOSDetailNavigationOptions
		: AndroidDetailNavigationOptions

export const EventDetail =
	Platform.OS === 'ios' ? IosEventDetail : AndroidEventDetail
