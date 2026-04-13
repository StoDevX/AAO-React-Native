import type {Temporal} from 'temporal-polyfill'
import type {DayOfWeekEnumType} from '../types'
import {twoLetterDay} from '../../../lib/temporal'

export const getDayOfWeek = (m: Temporal.ZonedDateTime): DayOfWeekEnumType =>
	twoLetterDay(m) as DayOfWeekEnumType
