import type {FilterType, PickerType} from '@frogpond/filter'

import type {ProcessedMealType} from '../types'
import {findMeal} from './find-menu'
import type {Moment} from 'moment'

export const EMPTY_MEAL: ProcessedMealType = {
	label: '',
	stations: [],
	starttime: '0:00',
	endtime: '0:00',
}

export function chooseMeal<T extends object>(
	meals: ProcessedMealType[],
	filters: FilterType<T>[],
	now: Moment,
): ProcessedMealType {
	let mealChooserFilter = filters.find(
		(f) => f.type === 'picker' && f.spec.title === "Today's Menus",
	) as PickerType<T> | undefined

	let selectedMeal: ProcessedMealType | undefined
	if (mealChooserFilter?.spec?.selected?.label) {
		const label = mealChooserFilter.spec.selected.label
		selectedMeal = meals.find((meal) => meal.label === label)
	} else {
		selectedMeal = findMeal(meals, now)
	}

	if (!selectedMeal) {
		selectedMeal = EMPTY_MEAL
	}

	return selectedMeal
}
