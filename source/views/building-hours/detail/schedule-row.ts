import {Platform} from 'react-native'

import {ScheduleRow as ScheduleRowIos} from './schedule-row-ios'
import {ScheduleRow as ScheduleRowAndroid} from './schedule-row-android'

export const ScheduleRow =
	Platform.OS === 'ios' ? ScheduleRowIos : ScheduleRowAndroid
