import {Platform} from 'react-native'

import {JobDetailView as IosDetail} from './detail-ios'
import {JobDetailView as AndroidDetail} from './detail-android'

export const JobDetailView = Platform.OS === 'ios' ? IosDetail : AndroidDetail
