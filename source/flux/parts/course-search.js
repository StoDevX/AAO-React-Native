// @flow

import {type FilterType} from '../../views/components/filter/types'

const UPDATE_COURSE_FILTERS = 'courseSearch/UPDATE_COURSE_FILTERS'

type UpdateCourseFiltersAction = {|
	type: 'courseSearch/UPDATE_COURSE_FILTERS',
	payload: Array<FilterType>,
|}
export function updateCourseFilters(
	filters: FilterType[],
): UpdateCourseFiltersAction {
	return {type: UPDATE_COURSE_FILTERS, payload: filters}
}

type Action = UpdateCourseFiltersAction

export type State = {|
	filters: Array<FilterType>,
|}

const initialState = {
	filters: [],
}

export function courseSearch(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_COURSE_FILTERS:
			return {...state, filters: action.payload}

		default:
			return state
	}
}
