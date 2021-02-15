import moment from 'moment-timezone'
import type {DayOfWeekEnumType} from '../types'

export const getDayOfWeek = (m: moment): DayOfWeekEnumType =>
	(m.format('dd') as any) as DayOfWeekEnumType
