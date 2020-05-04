// @flow

import {Platform} from 'react-native'
import {IosCredits} from './credits-ios'
import {AndroidCredits} from './credits-android'

export const Credits = Platform.OS === 'ios' ? IosCredits : AndroidCredits
