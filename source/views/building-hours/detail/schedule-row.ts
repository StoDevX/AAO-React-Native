import {Platform} from 'react-native'

import {ScheduleRow as ScheduleRowAndroid} from './schedule-row-android'
import {ScheduleRow as ScheduleRowIos} from './schedule-row-ios'

export const ScheduleRow =
	Platform.OS === 'ios' ? ScheduleRowIos : ScheduleRowAndroid
