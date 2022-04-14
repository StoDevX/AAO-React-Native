import type {Moment} from 'moment'
import type {ProcessedMealType} from '../types'
import type {FilterType, PickerType} from '@frogpond/filter'
import {findMeal} from './find-menu'

export function chooseMeal(
	meals: ProcessedMealType[],
	filters: FilterType[],
	now: Moment,
): ProcessedMealType {
	let mealChooserFilter: FilterType | undefined = filters.find(
		(f) => f.type === 'picker' && f.spec.title === "Today's Menus",
	) as PickerType | undefined

	let selectedMeal: ProcessedMealType | undefined = meals[0]
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
		selectedMeal = {
			label: '',
			stations: [],
			starttime: '0:00',
			endtime: '0:00',
		}
	}

	return selectedMeal
}
