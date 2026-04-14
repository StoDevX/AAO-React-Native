import {Temporal} from 'temporal-polyfill'
import {
	isSameOrBefore,
	parseTimeToday,
	isBefore,
} from '../../../source/lib/temporal'
import {timezone} from '@frogpond/constants'
import type {
	DayPartMenuType,
	DayPartsCollectionType,
	ProcessedMealType,
} from '../types'
import findIndex from 'lodash/findIndex'

export function findMenu(
	dayparts: DayPartsCollectionType,
	now: Temporal.ZonedDateTime,
): void | DayPartMenuType {
	if (!dayparts.length || !dayparts[0].length) {
		return
	}

	const daypart = dayparts[0]
	const menuIndex = findMenuIndex(daypart, now)
	return daypart[menuIndex]
}

export function findMeal(
	meals: ProcessedMealType[],
	now: Temporal.ZonedDateTime,
): ProcessedMealType | undefined {
	if (!meals.length) {
		return
	}

	const dayparts: DayPartMenuType[] = meals.map((m) => ({
		starttime: m.starttime,
		endtime: m.endtime,
		label: m.label,
		stations: m.stations,
		id: m.label,
		abbreviation: m.label,
	}))

	const mealIndex = findMenuIndex(dayparts, now)
	return meals[mealIndex]
}

function findMenuIndex(
	dayparts: DayPartMenuType[],
	now: Temporal.ZonedDateTime,
): number {
	if (dayparts.length === 1) {
		return 0
	}

	const times = dayparts.map(({starttime, endtime}) => ({
		start: parseTimeToday(starttime, timezone(), now),
		end: parseTimeToday(endtime, timezone(), now),
	}))

	let mealIndex = findIndex(times, ({end}) => isSameOrBefore(now, end))

	if (mealIndex === -1) {
		mealIndex = times.length - 1
	}

	return mealIndex
}

void isBefore
