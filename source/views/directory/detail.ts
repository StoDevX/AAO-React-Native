import {Platform} from 'react-native'

import {
	DirectoryDetailView as IosDetail,
	DetailNavigationOptions as IosNavigationOptions,
} from './detail.ios'
import {
	DirectoryDetailView as AndroidDetail,
	DetailNavigationOptions as AndroidNavigationOptions,
} from './detail.android'

export const DirectoryDetailView =
	Platform.OS === 'ios' ? IosDetail : AndroidDetail

export const DetailNavigationOptions =
	Platform.OS === 'ios' ? IosNavigationOptions : AndroidNavigationOptions
