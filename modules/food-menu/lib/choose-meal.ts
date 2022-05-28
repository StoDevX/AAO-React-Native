import type {Moment} from 'moment'
import type {ProcessedMealType} from '../types'
import type {FilterType, PickerType} from '@frogpond/filter'
import {findMeal} from './find-menu'

export const EMPTY_MEAL: ProcessedMealType = {
	label: '',
	stations: [],
	starttime: '0:00',
	endtime: '0:00',
}

export function chooseMeal(
	meals: ProcessedMealType[],
	filters: FilterType[],
	now: Moment,
): ProcessedMealType {
	let mealChooserFilter: FilterType | undefined = filters.find(
		(f) => f.type === 'picker' && f.spec.title === "Today's Menus",
	) as PickerType | undefined

	let selectedMeal: ProcessedMealType | undefined
	if (
		mealChooserFilter &&
		mealChooserFilter.spec.selected &&
		mealChooserFilter.spec.selected.label
	) {
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
