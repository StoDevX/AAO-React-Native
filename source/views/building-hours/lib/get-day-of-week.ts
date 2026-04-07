import type {Moment} from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import type {DayOfWeekEnumType} from '../types'

export const getDayOfWeek = (m: Moment): DayOfWeekEnumType =>
	m.clone().tz(timezone()).format('dd') as DayOfWeekEnumType
