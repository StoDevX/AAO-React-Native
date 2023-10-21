import {Platform} from 'react-native'

import {
	NavigationOptions as AndroidDetailNavigationOptions,
	View as AndroidDetail,
} from './detail-android'
import {
	NavigationOptions as IosDetailNavigationOptions,
	View as IosDetail,
} from './detail-ios'

const StudentWorkDetailView = Platform.OS === 'ios' ? IosDetail : AndroidDetail

export {StudentWorkDetailView as View}

export const NavigationOptions =
	Platform.OS === 'ios'
		? IosDetailNavigationOptions
		: AndroidDetailNavigationOptions
