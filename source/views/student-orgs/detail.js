// @flow

import {Platform} from 'react-native'

import {StudentOrgsDetailView as IosDetail} from './detail-ios'
import {StudentOrgsDetailView as AndroidDetail} from './detail-android'

export const StudentOrgsDetailView =
	Platform.OS === 'ios' ? IosDetail : AndroidDetail
