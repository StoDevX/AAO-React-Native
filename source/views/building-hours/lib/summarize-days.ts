import sortBy from 'lodash/sortBy'
import type {DayOfWeekEnumType, SingleBuildingScheduleType} from '../types'

import {daysOfTheWeek} from './constants'
import {formatDay} from '../../sis/course-search/lib/format-day'

const FULL_DAY_NAMES: Record<string, string> = {
	Su: 'Sunday',
	Mo: 'Monday',
	Tu: 'Tuesday',
	We: 'Wednesday',
	Th: 'Thursday',
	Fr: 'Friday',
	Sa: 'Saturday',
}

const SHORT_DAY_NAMES: Record<string, string> = {
	Su: 'Sun',
	Mo: 'Mon',
	Tu: 'Tue',
	We: 'Wed',
	Th: 'Thu',
	Fr: 'Fri',
	Sa: 'Sat',
}

function twoLetterToDay(code: string, full: boolean): string {
	return full ? (FULL_DAY_NAMES[code] ?? code) : (SHORT_DAY_NAMES[code] ?? code)
}

export function summarizeDays(
	days: DayOfWeekEnumType[],
	useFullDay = false,
): string {
	if (days.length === 1) {
		return twoLetterToDay(days[0], true)
	}

	// Sort the days so we have fewer edge-cases
	let sortedDays = sortBy(days, (d) => daysOfTheWeek.indexOf(d))

	let startDay = sortedDays[0]
	let endDay = sortedDays[sortedDays.length - 1]

	// Get the indices of the start/end days from the master list of all days
	let startIndex = daysOfTheWeek.indexOf(startDay)
	let endIndex = daysOfTheWeek.indexOf(endDay)

	// if the number of days given is not the number of days in the span,
	// join the list. (There's no point to converting them here.)
	if (endIndex - startIndex !== sortedDays.length - 1) {
		if (useFullDay) {
			return formatFullDay(sortedDays)
		}

		return sortedDays.join(', ')
	}

	// Now we check for common shorthands
	if (startDay === 'Mo' && endDay === 'Fr') {
		return 'Weekdays'
	} else if (startDay === 'Sa' && endDay === 'Su') {
		return 'Weekends'
	} else if (startDay === 'Mo' && endDay === 'Su') {
		return 'Every day'
	}

	// And if we don't find anything, we need to return the spanned-days format
	let start = twoLetterToDay(startDay, useFullDay)
	let end = twoLetterToDay(endDay, useFullDay)

	return `${start} — ${end}`
}

function formatFullDay(sortedDays: DayOfWeekEnumType[]) {
	let formatted = sortedDays.map((day, index) => {
		let formattedDay = formatDay(day)

		if (index === sortedDays.length - 1) {
			return `and ${formattedDay}`
		}

		return formattedDay
	})

	if (formatted.length === 2) {
		return formatted.join(' ')
	}

	return formatted.join(', ')
}

export function summarizeDaysAndHours(
	schedule: SingleBuildingScheduleType,
): string {
	let daySummary = summarizeDays(schedule.days, true)

	if (daySummary === 'Weekdays' || daySummary === 'Weekends') {
		daySummary = `on ${daySummary}`
	} else if (daySummary === 'Every day') {
		daySummary = daySummary.toLowerCase()
	} else {
		daySummary = `every ${daySummary}`
	}

	return `Opens at ${schedule.from} and closes at ${schedule.to} ${daySummary}.`
}
