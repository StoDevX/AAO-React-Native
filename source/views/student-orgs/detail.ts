import {Platform} from 'react-native'

import {
	View as IosDetail,
	NavigationOptions as ListNavigationOptions,
} from './detail-ios'
import {
	View as AndroidDetail,
	NavigationOptions as DetailNavigationOptions,
} from './detail-android'

const StudentOrgsDetailView = Platform.OS === 'ios' ? IosDetail : AndroidDetail

export {StudentOrgsDetailView as View}

export const NavigationOptions =
	Platform.OS === 'ios' ? ListNavigationOptions : DetailNavigationOptions
