import type {DayOfWeekEnumType} from '../types'
import type {Moment} from 'moment-timezone'

export const getDayOfWeek = (m: Moment): DayOfWeekEnumType =>
	m.format('dd') as DayOfWeekEnumType
