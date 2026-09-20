import type {FilterType, PickerType} from '@frogpond/filter'
import type {ProcessedMealType} from '../types'
import {formatMealTimes} from './meal-times'

/** One meal the reader can choose, and when the cafe serves it. */
export type MealHeaderOption = {
	label: string
	/** e.g. `7:15AM – 9:45AM`, or `null` when BonApp published no times for it. */
	time: string | null
}

/** The meal pull-down a menu screen draws in its navigation bar. */
export type MealHeaderMenu = {
	/** Names the list being chosen from, shown above the menu's own actions. */
	title: string
	/** Every meal the cafe serves today, in the order it serves them. */
	options: MealHeaderOption[]
	/** The meal on screen, which labels the button itself. */
	selected: string
}

/**
 * The meal picker's contents, or `null` when there is nothing to pick. A cafe
 * serving one meal offers no choice, and a pull-down over a single option is a
 * control that cannot do anything.
 *
 * `selected` is passed in rather than read from the picker's own spec: which
 * meal is on screen is `chooseMeal`'s answer, which reads the clock as well as
 * the filter.
 *
 * The picker says what can be chosen and `meals` says when each one is served,
 * matched by label -- the picker's options are built from the same meals, so a
 * label with nothing to match is a meal the menu never carried.
 */
export function mealHeaderMenu<T extends object>(
	filters: FilterType<T>[],
	selected: string,
	meals: ProcessedMealType[],
): MealHeaderMenu | null {
	let mealFilter = filters.find((f) => f.type === 'picker') as PickerType<T> | undefined

	if (!mealFilter || mealFilter.spec.options.length <= 1) {
		return null
	}

	let mealsByLabel = new Map(meals.map((meal) => [meal.label, meal]))

	return {
		title: mealFilter.spec.title,
		options: mealFilter.spec.options.map((option) => {
			let meal = mealsByLabel.get(option.label)
			return {
				label: option.label,
				time: meal ? formatMealTimes(meal) : null,
			}
		}),
		selected,
	}
}
