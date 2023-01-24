import {Platform} from 'react-native'

import {ScheduleTable as ScheduleTableIos} from './schedule-table-ios'
import {ScheduleTable as ScheduleTableAndroid} from './schedule-table-android'

export const ScheduleTable =
	Platform.OS === 'ios' ? ScheduleTableIos : ScheduleTableAndroid
