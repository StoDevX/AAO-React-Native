import moment, {Moment} from 'moment-timezone'
import type {DayOfWeekEnumType} from '../types'

export const getDayOfWeek = (m: Moment): DayOfWeekEnumType =>
	m.format('dd') as any as DayOfWeekEnumType
