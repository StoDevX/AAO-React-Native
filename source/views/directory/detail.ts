import {Platform} from 'react-native'

import {
	DetailNavigationOptions as AndroidNavigationOptions,
	DirectoryDetailView as AndroidDetail,
} from './detail.android'
import {
	DetailNavigationOptions as IosNavigationOptions,
	DirectoryDetailView as IosDetail,
} from './detail.ios'

export const DirectoryDetailView =
	Platform.OS === 'ios' ? IosDetail : AndroidDetail

export const DetailNavigationOptions =
	Platform.OS === 'ios' ? IosNavigationOptions : AndroidNavigationOptions
