import {Platform} from 'react-native'

import {DirectoryDetailView as IosDetail} from './detail.ios'
import {DirectoryDetailView as AndroidDetail} from './detail.android'

export const DirectoryDetailView =
	Platform.OS === 'ios' ? IosDetail : AndroidDetail
