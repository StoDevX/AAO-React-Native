import {Platform} from 'react-native'

import {EventDetail as IosEventDetail} from './event-detail-ios'
import {EventDetail as AndroidEventDetail} from './event-detail-android'

export const EventDetail =
	Platform.OS === 'ios' ? IosEventDetail : AndroidEventDetail
