import type {Moment} from 'moment-timezone'
import {findMeal} from '@frogpond/food-menu/lib/find-menu'
import {isFeatured} from '@frogpond/food-menu/lib/is-featured'
import {mealWindow} from '@frogpond/food-menu/lib/meal-times'

import {
	findCurrentOpen,
	formatStatusTime,
	getDayOfWeek,
	windowOpeningOn,
} from '../building-hours/lib'
import type {BuildingType} from '../building-hours/types'
import type {MenuItemContainerType, ProcessedMealType} from '../menus/types'

/** The hotline speaks English whatever the device's locale, so its times do too. */
const SPOKEN_LOCALE = 'en-US'

/** A time as the voice should read it: `7:15 a.m.`, `2 p.m.`, `noon`, `midnight`. */
function spokenTime(time: Moment): string {
	return formatStatusTime(time, SPOKEN_LOCALE)
		.replace(/\s*AM$/u, ' a.m.')
		.replace(/\s*PM$/u, ' p.m.')
}

/** `a`, `a and b`, `a, b and c`. */
function spokenList(parts: string[]): string {
	if (parts.length <= 1) {
		return parts.join('')
	}
	return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}

/** What the hotline says when a hall's menu could not be loaded. */
export const UNAVAILABLE_SPECIALS = (hall: string): string =>
	`We're unable to get the specials at ${hall} right now.`

/**
 * The specials of the meal `hall` is serving at `now`, or its next one today,
 * read station by station: what Menus' Only Show Specials toggle lists, its
 * Specials and Additional Favorites. After the day's last meal, there are none.
 */
export function specialsAnswer(
	hall: string,
	meals: ProcessedMealType[],
	items: MenuItemContainerType,
	now: Moment,
): string {
	let none = `There are no specials at ${hall} right now.`
	let meal = findMeal(meals, now)
	if (!meal) {
		return none
	}

	let window = mealWindow(meal, now.format('YYYY-MM-DD'))
	if (window && !now.isBefore(window.end)) {
		return none
	}

	let stations = meal.stations.flatMap((station) => {
		let specials = station.items
			.map((id) => items[id])
			.filter((food) => food !== undefined && isFeatured(food))
			.map((food) => food.label.toLowerCase())
		return specials.length > 0 ? [`At ${station.label}: ${spokenList(specials)}.`] : []
	})
	if (stations.length === 0) {
		return none
	}

	// A café with one all-day meal calls it "Menu", which the sentence leaves out.
	let mealName = meal.label === 'Menu' ? '' : `${meal.label.toLowerCase()} `
	return [`Here are today's ${mealName}specials at ${hall}.`, ...stations].join(' ')
}

/**
 * The windows `building` opens in on `now`'s day, each named by its schedule
 * when it has more than one: "Stav Hall is open today for Breakfast from…".
 */
export function hoursAnswer(building: BuildingType, now: Moment): string {
	let day = getDayOfWeek(now)
	let sets = (building.schedule ?? []).filter((set) => set.isPhysicallyOpen !== false)
	let named = sets.length > 1

	let clauses = sets.flatMap((set) =>
		set.hours
			.filter((hours) => hours.days.includes(day))
			.map((hours) => {
				let {open, close} = windowOpeningOn(hours, now)
				let range = `from ${spokenTime(open)} to ${spokenTime(close)}`
				return named ? `${set.title} ${range}` : range
			}),
	)

	if (clauses.length === 0) {
		return `${building.name} is closed today.`
	}

	let joined =
		clauses.length === 1 ? clauses[0] : `${clauses.slice(0, -1).join(', ')}, and ${clauses.at(-1)}`
	return sentence(`${building.name} is open today ${named ? 'for ' : ''}${joined}`)
}

/** `text` with a full stop, unless it already ends in one, as "2 p.m." does. */
function sentence(text: string): string {
	return text.endsWith('.') ? text : `${text}.`
}

/** "Stav Hall, open until 2 p.m.", or null when `building` is shut at `now`. */
export function openNowLabel(building: BuildingType, now: Moment): string | null {
	let open = findCurrentOpen(building, now)
	return open ? `${building.name}, open until ${spokenTime(open.close)}` : null
}
