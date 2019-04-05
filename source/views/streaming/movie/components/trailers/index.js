// @flow

import {Platform} from 'react-native'
import {IosTrailers} from './trailers-ios'
import {AndroidTrailers} from './trailers-android'

export const Trailers = Platform.OS === 'ios' ? IosTrailers : AndroidTrailers
