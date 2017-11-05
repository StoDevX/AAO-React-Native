// @flow

import type momentT from 'moment'
import type {ProcessedMealType} from '../types'
import type {FilterType} from '../../components/filter'
import {findMeal} from './find-menu'

export function chooseMeal(
  meals: ProcessedMealType[],
  filters: FilterType[],
  now: momentT,
): ProcessedMealType {
  const mealChooserFilter: ?FilterType = filters.find(
    f => f.type === 'picker' && f.spec.title === "Today's Menus",
  )

  let selectedMeal = meals[0]
  if (
    mealChooserFilter &&
    mealChooserFilter.spec.selected &&
    mealChooserFilter.spec.selected.label
  ) {
    let label = mealChooserFilter.spec.selected.label
    selectedMeal = meals.find(meal => meal.label === label)
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
