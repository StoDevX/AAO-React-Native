// @flow

import {type FilterType} from '../../views/components/filter/types'
import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

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

const UPDATE_RECENT_SEARCHES = 'courseSearch/UPDATE_RECENT_SEARCHES'

type UpdateRecentSearchesAction = {|
	type: 'courseSearch/UPDATE_RECENT_SEARCHES',
	payload: string[],
|}
export function updateRecentSearches(
	query: string,
): ThunkAction<UpdateRecentSearchesAction> {
	return (dispatch, getState) => {
		const state = getState()

		const oldRecentSearches = state.courseSearch ? state.courseSearch.recentSearches : []
		let newRecentSearches = oldRecentSearches
		if (newRecentSearches.length === 0) {
			newRecentSearches = [query]
		} else {
			newRecentSearches.unshift(query)
		}
		if (newRecentSearches.length > 3) {
			newRecentSearches.pop()
		}
		dispatch({type: UPDATE_RECENT_SEARCHES, payload: newRecentSearches})
	}
}

type Action = UpdateCourseFiltersAction | UpdateRecentSearchesAction

export type State = {|
	filters: Array<FilterType>,
	recentSearches: string[],
|}

const initialState = {
	filters: [],
	recentSearches: [],
}

export function courseSearch(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_COURSE_FILTERS:
			return {...state, filters: action.payload}
		case UPDATE_RECENT_SEARCHES:
			return {...state, recentSearches: action.payload}
		default:
			return state
	}
}
