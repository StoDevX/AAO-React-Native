// @flow

import {Platform} from 'react-native'
import {IosPlot} from './plot-ios'
import {AndroidPlot} from './plot-android'

export const Plot = Platform.OS === 'ios' ? IosPlot : AndroidPlot
