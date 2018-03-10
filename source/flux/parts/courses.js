// @flow

import {type ReduxState} from '../index'
import {type FilterType} from '../../views/components/filter/types'
import {
	loadCachedCourses,
	updateStoredCourses,
	areAnyTermsCached,
} from '../../lib/course-search'
import type {CourseType} from '../../lib/course-search'

const UPDATE_COURSE_FILTERS = 'courseSearch/UPDATE_COURSE_FILTERS'
const LOAD_CACHED_COURSES = 'sis/LOAD_CACHED_COURSES'
const COURSES_LOADED = 'sis/COURSES_LOADED'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

type UpdateCourseFiltersAction = {|
	type: 'courseSearch/UPDATE_COURSE_FILTERS',
	payload: Array<FilterType>,
|}
export function updateCourseFilters(
	filters: FilterType[],
): UpdateCourseFiltersAction {
	return {type: UPDATE_COURSE_FILTERS, payload: filters}
}

type LoadCachedCoursesAction = {|
	type: 'sis/LOAD_CACHED_COURSES',
	payload: Array<CourseType>,
|}
type CoursesLoadedAction = {|
	type: 'sis/COURSES_LOADED',
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

type Action =
	| UpdateCourseFiltersAction
	| LoadCachedCoursesAction
	| CoursesLoadedAction

export type State = {|
	filters: Array<FilterType>,
	allCourses: Array<CourseType>,
	readyState: 'not-loaded' | 'ready',
	validGEs: string[],
|}

const initialState = {
	filters: [],
	allCourses: [],
	readyState: 'not-loaded',
	validGEs: [],
}

export function courses(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_COURSE_FILTERS:
			return {...state, filters: action.payload}

		case LOAD_CACHED_COURSES:
			return {...state, allCourses: action.payload}

		case COURSES_LOADED:
			return {...state, readyState: 'ready'}

		default:
			return state
	}
}
