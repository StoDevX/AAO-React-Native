import {Platform} from 'react-native'

import {View as IosDetail} from './detail-ios'
import {View as AndroidDetail} from './detail-android'

export const StudentOrgsDetailView =
	Platform.OS === 'ios' ? IosDetail : AndroidDetail
