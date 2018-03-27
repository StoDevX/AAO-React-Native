// @flow

import {type ReduxState} from '../index'
import {type FilterType} from '../../views/components/filter/types'
import {
	loadCachedCourses,
	updateStoredCourses,
	areAnyTermsCached,
} from '../../lib/course-search'
import type {CourseType} from '../../lib/course-search'
import * as storage from '../../lib/storage'
import {
	type FilterComboType,
	formatFilterCombo,
} from '../../views/sis/course-search/lib/format-filter-combo'

const UPDATE_COURSE_FILTERS = 'courses/UPDATE_COURSE_FILTERS'
const LOAD_CACHED_COURSES = 'courses/LOAD_CACHED_COURSES'
const COURSES_LOADED = 'courses/COURSES_LOADED'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

type UpdateCourseFiltersAction = {|
	type: 'courses/UPDATE_COURSE_FILTERS',
	payload: Array<FilterType>,
|}
export function updateCourseFilters(
	filters: FilterType[],
): UpdateCourseFiltersAction {
	return {type: UPDATE_COURSE_FILTERS, payload: filters}
}

const UPDATE_RECENT_FILTERS = 'courses/UPDATE_RECENT_FILTERS'

type UpdateRecentFiltersAction = {|
	type: 'courses/UPDATE_RECENT_FILTERS',
	payload: FilterComboType[],
|}

export function updateRecentFilters(
	filters: FilterType[],
): ThunkAction<UpdateRecentFiltersAction> {
	return (dispatch, getState) => {
		const state = getState()

		const newRecentFilter = formatFilterCombo(filters)
		console.log(newRecentFilter)
		const recentFilters = state.courses ? state.courses.recentFilters : []
		if (
			!recentFilters.find(f => f.description === newRecentFilter.description) &&
			newRecentFilter.description.length !== 0
		) {
			const newFilters = [newRecentFilter, ...recentFilters].slice(0, 3)

			// TODO: remove saving logic from reducers
			storage.setRecentFilters(newFilters)

			dispatch({type: UPDATE_RECENT_FILTERS, payload: newFilters})
		}
	}
}

const LOAD_RECENT_FILTERS = 'courses/LOAD_RECENT_FILTERS'

type LoadRecentFiltersAction = {|
	type: 'courses/LOAD_RECENT_FILTERS',
	payload: FilterComboType[],
|}
export async function loadRecentFilters(): Promise<LoadRecentFiltersAction> {
	const recentFilters = await storage.getRecentFilters()
	return {type: LOAD_RECENT_FILTERS, payload: recentFilters}
}

type LoadCachedCoursesAction = {|
	type: 'courses/LOAD_CACHED_COURSES',
	payload: Array<CourseType>,
|}
type CoursesLoadedAction = {|
	type: 'courses/COURSES_LOADED',
|}

export type LoadCourseDataActionType = ThunkAction<
	LoadCachedCoursesAction | CoursesLoadedAction,
>
export type UpdateCourseDataActionType = ThunkAction<
	LoadCachedCoursesAction | CoursesLoadedAction,
>

export function loadCourseDataIntoMemory(): LoadCourseDataActionType {
	return async dispatch => {
		const areAnyCached = await areAnyTermsCached()

		if (!areAnyCached) {
			return
		}

		const cachedCourses = await loadCachedCourses()
		dispatch({type: LOAD_CACHED_COURSES, payload: cachedCourses})
		dispatch({type: COURSES_LOADED})
	}
}

export function updateCourseData(): UpdateCourseDataActionType {
	return async dispatch => {
		const updateNeeded = await updateStoredCourses()

		if (updateNeeded) {
			const cachedCourses = await loadCachedCourses()
			dispatch({type: LOAD_CACHED_COURSES, payload: cachedCourses})
			dispatch({type: COURSES_LOADED})
		}
	}
}

const LOAD_RECENT_SEARCHES = 'courses/LOAD_RECENT_SEARCHES'

type LoadRecentSearchesAction = {|
	type: 'courses/LOAD_RECENT_SEARCHES',
	payload: string[],
|}
export async function loadRecentSearches(): Promise<LoadRecentSearchesAction> {
	const recentSearches = await storage.getRecentSearches()
	return {type: LOAD_RECENT_SEARCHES, payload: recentSearches}
}

const UPDATE_RECENT_SEARCHES = 'courses/UPDATE_RECENT_SEARCHES'

type UpdateRecentSearchesAction = {|
	type: 'courses/UPDATE_RECENT_SEARCHES',
	payload: string[],
|}
export function updateRecentSearches(
	query: string,
): ThunkAction<UpdateRecentSearchesAction> {
	return (dispatch, getState) => {
		const state = getState()

		let recentSearches = state.courses ? state.courses.recentSearches : []
		const recentLowerCase = recentSearches.map(query => query.toLowerCase())
		if (recentLowerCase.includes(query.toLowerCase())) {
			return
		}
		recentSearches = [query, ...recentSearches].slice(0, 3)

		// TODO: remove saving logic from reducers
		storage.setRecentSearches(recentSearches)

		dispatch({type: UPDATE_RECENT_SEARCHES, payload: recentSearches})
	}
}

type Action =
	| UpdateCourseFiltersAction
	| LoadCachedCoursesAction
	| CoursesLoadedAction
	| UpdateRecentSearchesAction
	| LoadRecentSearchesAction
	| UpdateRecentFiltersAction
	| LoadRecentFiltersAction

export type State = {|
	filters: Array<FilterType>,
	allCourses: Array<CourseType>,
	readyState: 'not-loaded' | 'ready',
	validGEs: string[],
	recentFilters: FilterComboType[],
	recentSearches: string[],
|}

const initialState = {
	filters: [],
	allCourses: [],
	readyState: 'not-loaded',
	validGEs: [],
	recentFilters: [],
	recentSearches: [],
}

export function courses(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_COURSE_FILTERS:
			return {...state, filters: action.payload}

		case LOAD_RECENT_FILTERS:
			return {...state, recentFilters: action.payload}

		case UPDATE_RECENT_FILTERS:
			return {...state, recentFilters: action.payload}

		case LOAD_CACHED_COURSES:
			return {...state, allCourses: action.payload}

		case COURSES_LOADED:
			return {...state, readyState: 'ready'}

		case LOAD_RECENT_SEARCHES:
			return {...state, recentSearches: action.payload}

		case UPDATE_RECENT_SEARCHES:
			return {...state, recentSearches: action.payload}

		default:
			return state
	}
}
