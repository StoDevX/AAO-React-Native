import {Platform} from 'react-native'

import {ScheduleTable as ScheduleTableAndroid} from './schedule-table-android'
import {ScheduleTable as ScheduleTableIos} from './schedule-table-ios'

export const ScheduleTable =
	Platform.OS === 'ios' ? ScheduleTableIos : ScheduleTableAndroid
