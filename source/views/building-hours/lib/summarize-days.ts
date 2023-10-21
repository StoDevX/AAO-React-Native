import {formatDay} from '../../sis/course-search/lib/format-day'
import type {DayOfWeekEnumType, SingleBuildingScheduleType} from '../types'
import {daysOfTheWeek} from './constants'
import sortBy from 'lodash/sortBy'
import moment from 'moment-timezone'

export function summarizeDays(
	days: DayOfWeekEnumType[],
	useFullDay = false,
): string {
	// If one day is given: return the full name of that day.
	//    ['Fr'] => 'Friday'
	// If multiple contiguous days are given: return the bookended 3-letter days
	//    ['Mo', 'Tu', 'We'] => 'Mon — Wed'
	// If multiple non-contiguous days are given: return the 2-letter days, comma-separated
	//    ['Fr', 'Sa'] => 'Fr, Sa'
	// If the span has a common shorthand: return that shorthand
	//    ['Mo', 'Tu', 'We', 'Th', Fr'] => "Weekdays"

	if (days.length === 1) {
		return moment(days[0], 'dd').format('dddd')
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

	let dayFormat = useFullDay ? 'dddd' : 'ddd'

	// And if we don't find anything, we need to return the spanned-days format
	let start = moment(startDay, 'dd').format(dayFormat)
	let end = moment(endDay, 'dd').format(dayFormat)

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

	/**
	 * This targets timespans like [We, Fr] which are formatted as
	 * "Wednesday, and Friday" so we can change those here to read
	 * as "Wendesday and Friday".
	 *
	 * Consecutive timespans such as [We, Th] are formatted as
	 * "Wednesday – Thursday", and while they meet the length
	 * criteria to be returned below they should come out unmodified.
	 */
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
