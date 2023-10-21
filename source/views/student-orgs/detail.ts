import {Platform} from 'react-native'

import {
	NavigationOptions as AndroidDetailNavigationOptions,
	View as AndroidDetail,
} from './detail-android'
import {
	NavigationOptions as IosDetailNavigationOptions,
	View as IosDetail,
} from './detail-ios'

const StudentOrgsDetailView = Platform.OS === 'ios' ? IosDetail : AndroidDetail

export {StudentOrgsDetailView as View}

export const NavigationOptions =
	Platform.OS === 'ios'
		? IosDetailNavigationOptions
		: AndroidDetailNavigationOptions
