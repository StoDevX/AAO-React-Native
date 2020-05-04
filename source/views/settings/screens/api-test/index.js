// @flow

import {Platform} from 'react-native'
import {IOSAPITestView} from './api-test-ios'
import {AndroidAPITestView} from './api-test-android'

export const APITestView =
	Platform.OS === 'ios' ? IOSAPITestView : AndroidAPITestView
