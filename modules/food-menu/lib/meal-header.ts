import type {FilterType, PickerType} from '@frogpond/filter'

/** The meal pull-down a menu screen draws in its navigation bar. */
export type MealHeaderMenu = {
	/** Names the list being chosen from, shown above the menu's own actions. */
	title: string
	/** Every meal the cafe serves today, in the order it serves them. */
	options: string[]
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
 */
export function mealHeaderMenu<T extends object>(
	filters: FilterType<T>[],
	selected: string,
): MealHeaderMenu | null {
	let mealFilter = filters.find((f) => f.type === 'picker') as PickerType<T> | undefined

	if (!mealFilter || mealFilter.spec.options.length <= 1) {
		return null
	}

	return {
		title: mealFilter.spec.title,
		options: mealFilter.spec.options.map((option) => option.label),
		selected,
	}
}
