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
import {filterListSpecs} from '../../views/components/filter'
import {formatTerms} from '../../views/sis/course-search/lib/format-terms'

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

const UPDATE_RECENT_FILTERS = 'sis/UPDATE_RECENT_FILTERS'

type UpdateRecentFiltersAction = {|
	type: 'courses/UPDATE_RECENT_FILTERS',
	payload: string[],
|}

export function updateRecentFilters(
	filters: string[],
): ThunkAction<UpdateRecentFiltersAction> {
	return (dispatch, getState) => {
		const state = getState()

		const enabledFilters = filters.filter(f => f.enabled).map(f => {
			switch (f.key) {
				case "status":
					return "Open Courses"
				case "type":
					return "Labs Only"
				case "term":
					const termFilter = filterListSpecs(filters).find(f => f.key === 'term')
					const selectedTerms = termFilter ? termFilter.spec.selected : []
					const terms = selectedTerms.map(t => parseInt(t.title))
					return formatTerms(terms)
				case "gereqs":
					const geFilter = filterListSpecs(filters).find(f => f.key === 'gereqs')
					const selectedGEs = geFilter ? geFilter.spec.selected : []
					return selectedGEs.map(ge => ge.title).join('/')
				case "departments":
					const deptFilter = filterListSpecs(filters).find(f => f.key === 'departments')
					const selectedDepts = deptFilter ? deptFilter.spec.selected : []
					return selectedDepts.map(dept => dept.title).join('/')
				default:
					return ''
			}
		}).join(', ')
		let recentFilters = state.courses ? state.courses.recentFilters : []
		if (recentFilters.includes(enabledFilters)) {
			dispatch({type: UPDATE_RECENT_FILTERS, payload: recentFilters})
		}
		recentFilters = [enabledFilters, ...recentFilters].slice(0, 3)

		// TODO: remove saving logic from reducers
		storage.setRecentFilters(recentFilters)

		dispatch({type: UPDATE_RECENT_FILTERS, payload: recentFilters})
	}
}

const LOAD_RECENT_FILTERS = 'sis/LOAD_RECENT_FILTERS'

type LoadRecentFiltersAction = {|
	type: 'courses/LOAD_RECENT_FILTERS',
	payload: string[],
|}
export async function loadRecentFilters(): Promise<LoadRecentFiltersAction> {
	const recentFilters = await storage.getRecentFilters()
	return {type: LOAD_RECENT_FILTERS, payload: recentFilters}
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

export type State = {|
	filters: Array<FilterType>,
	allCourses: Array<CourseType>,
	readyState: 'not-loaded' | 'ready',
	validGEs: string[],
	recentFilters: string[],
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
