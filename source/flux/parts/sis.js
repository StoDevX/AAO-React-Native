// @flow

import {type ReduxState} from '../index'
import {getBalances, type BalancesShapeType} from '../../lib/financials'
import {loadCachedCourses, updateStoredCourses, loadGEs} from '../../lib/course-search'
import type {CourseType} from '../../lib/course-search'
import type {FilterType} from '../../views/sis/course-search/filters/types'

const UPDATE_BALANCES_SUCCESS = 'sis/UPDATE_BALANCES_SUCCESS'
const UPDATE_BALANCES_FAILURE = 'sis/UPDATE_BALANCES_FAILURE'
const LOAD_CACHED_COURSES = 'sis/LOAD_CACHED_COURSES'
const TERMS_UPDATE_START = 'sis/TERMS_UPDATE_START'
const TERMS_UPDATE_COMPLETE = 'sis/TERMS_UPDATE_COMPLETE'
const UPDATE_FILTERS = 'sis/UPDATE_FILTERS'

type UpdateBalancesSuccessAction = {|
	type: 'sis/UPDATE_BALANCES_SUCCESS',
	payload: BalancesShapeType,
|}
type UpdateBalancesFailureAction = {|
	type: 'sis/UPDATE_BALANCES_FAILURE',
	payload: Error,
|}

type UpdateBalancesActions =
	| UpdateBalancesSuccessAction
	| UpdateBalancesFailureAction

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

export type UpdateBalancesType = ThunkAction<UpdateBalancesActions>
export function updateBalances(
	forceFromServer: boolean = false,
): UpdateBalancesType {
	return async (dispatch, getState) => {
		const state = getState()
		const isConnected = state.app ? state.app.isConnected : false
		const balances = await getBalances(isConnected, forceFromServer)
		if (balances.error) {
			dispatch({type: UPDATE_BALANCES_FAILURE, payload: balances.value})
		} else {
			dispatch({type: UPDATE_BALANCES_SUCCESS, payload: balances.value})
		}
	}
}

type LoadCachedCoursesAction = {|
	type: 'sis/LOAD_CACHED_COURSES',
	payload: Array<CourseType>,
|}

type TermsUpdateStartAction = {|type: 'sis/TERMS_UPDATE_START'|}

type TermsUpdateCompleteAction = {|type: 'sis/TERMS_UPDATE_COMPLETE'|}
export type UpdateCourseDataActionType = ThunkAction<
	TermsUpdateAction | LoadCachedCoursesAction,
>
export function updateCourseData(): UpdateCourseDataActionType {
	return async (dispatch, getState) => {
		const state = getState()
		const courseDataState = state.sis ? state.sis.courseDataState : 'not-loaded'
		const dataNotLoaded = courseDataState === 'not-loaded'
		let updateNeeded = await updateStoredCourses()
		if (updateNeeded || dataNotLoaded) {
			dispatch({type: TERMS_UPDATE_START})
			const cachedCourses = await loadCachedCourses()
			const validGEs = await loadGEs()
			dispatch({type: LOAD_CACHED_COURSES, payload: {'courses': cachedCourses, 'gereqs': validGEs}})
			dispatch({type: TERMS_UPDATE_COMPLETE})
		}
	}
}

type TermsUpdateAction = TermsUpdateStartAction | TermsUpdateCompleteAction

type UpdateFiltersAction = {|
	type: 'sis/UPDATE_FILTERS',
	payload: FilterType,
|}

export type UpdateFiltersActionType = ThunkAction<UpdateFiltersAction>
export function updateFilters(newFilter: FilterType): UpdateFiltersActionType {
	return async (dispatch, getState) => {
		const state = getState()
		const currentFilters = state.sis ? state.sis.filters : []
		const newFilters = currentFilters.find(filter => filter.value === newFilter.value) !== undefined
			? currentFilters.filter(filter => filter.value !== newFilter.value)
			: [...currentFilters, newFilter]

		dispatch({type: UPDATE_FILTERS, payload: newFilters})
	}
}

type Action =
	| UpdateBalancesActions
	| TermsUpdateAction
	| LoadCachedCoursesAction
	| UpdateFiltersAction

export type State = {|
	balancesErrorMessage: ?string,
	flexBalance: ?string,
	oleBalance: ?string,
	printBalance: ?string,
	mealsRemainingToday: ?string,
	mealsRemainingThisWeek: ?string,
	mealPlanDescription: ?string,
	allCourses: Array<CourseType>,
	courseDataState: string,
	validGEs: string[],
	filters: Array<FilterType>,
|}
const initialState = {
	balancesErrorMessage: null,
	flexBalance: null,
	oleBalance: null,
	printBalance: null,
	mealsRemainingToday: null,
	mealsRemainingThisWeek: null,
	mealPlanDescription: null,
	allCourses: [],
	courseDataState: 'not-loaded',
	validGEs: [],
	filters: [],
}
export function sis(state: State = initialState, action: Action) {
	switch (action.type) {
		case UPDATE_BALANCES_FAILURE:
			return {...state, balancesErrorMessage: action.payload.message}
		case UPDATE_BALANCES_SUCCESS: {
			const p = action.payload
			return {
				...state,
				oleBalance: p.ole,
				flexBalance: p.flex,
				printBalance: p.print,
				mealsRemainingThisWeek: p.weekly,
				mealsRemainingToday: p.daily,
				mealPlanDescription: p.plan,
				balancesErrorMessage: null,
			}
		}
		case LOAD_CACHED_COURSES:
			return {...state, allCourses: action.payload.courses, courseDataState: 'updated', validGEs: action.payload.gereqs}
		case TERMS_UPDATE_START:
			return {...state, courseDataState: 'updating'}
		case TERMS_UPDATE_COMPLETE:
			return {...state, courseDataState: 'updated'}
		case UPDATE_FILTERS:
			return {...state, filters: action.payload}

		default:
			return state
	}
}
