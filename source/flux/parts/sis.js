// @flow

import {type ReduxState} from '../index'
import {getBalances, type BalancesShapeType} from '../../lib/financials'
import {loadCachedCourses, updateStoredCourses} from '../../lib/course-search'
import type {CourseType} from '../../lib/course-search'

const UPDATE_BALANCES_SUCCESS = 'sis/UPDATE_BALANCES_SUCCESS'
const UPDATE_BALANCES_FAILURE = 'sis/UPDATE_BALANCES_FAILURE'
const LOAD_CACHED_COURSES = 'sis/LOAD_CACHED_COURSES'
const TERMS_UPDATE_START = 'sis/TERMS_UPDATE_START'
const TERMS_UPDATE_COMPLETE = 'sis/TERMS_UPDATE_COMPLETE'
const COURSE_CACHE_INIT = 'sis/COURSE_CACHE_INIT'

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

type CourseCacheInitAction = {|type: 'sis/COURSE_CACHE_INIT'|}

export type UpdateCourseDataActionType = ThunkAction<
	TermsUpdateAction | LoadCachedCoursesAction | CourseCacheInitAction,
>
export function updateCourseData(): UpdateCourseDataActionType {
	return async (dispatch, getState) => {
		const state = getState()
		const courseDataState = state.sis ? state.sis.courseDataState : 'not-loaded'
		const dataNotLoaded = courseDataState === 'not-loaded'
		dispatch({type: COURSE_CACHE_INIT})
		let updateNeeded = await updateStoredCourses()
		if (updateNeeded || dataNotLoaded) {
			dispatch({type: TERMS_UPDATE_START})
			const cachedCourses = await loadCachedCourses()
			dispatch({type: LOAD_CACHED_COURSES, payload: cachedCourses})
			dispatch({type: TERMS_UPDATE_COMPLETE})
		}
	}
}

type TermsUpdateAction = TermsUpdateStartAction | TermsUpdateCompleteAction

type Action =
	| UpdateBalancesActions
	| TermsUpdateAction
	| LoadCachedCoursesAction
	| CourseCacheInitAction

export type State = {|
	balancesErrorMessage: ?string,
	flexBalance: ?string,
	oleBalance: ?string,
	printBalance: ?string,
	mealsRemainingToday: ?string,
	mealsRemainingThisWeek: ?string,
	mealPlanDescription: ?string,
	allCourses: Array<CourseType>,
	courseDataState: 'not-loaded' | 'preparing' | 'updating' | 'updated',
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
			return {...state, allCourses: action.payload}
		case TERMS_UPDATE_START:
			return {...state, courseDataState: 'updating'}
		case TERMS_UPDATE_COMPLETE:
			return {...state, courseDataState: 'updated'}
		case COURSE_CACHE_INIT:
			return {...state, courseDataState: 'preparing'}
		default:
			return state
	}
}
