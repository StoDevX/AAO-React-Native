// @flow

import {type ReduxState} from '../index'
import {getBalances, type BalancesShapeType} from '../../lib/financials'
import {
	loadCachedCourses,
	updateStoredCourses,
	areAnyTermsCached,
} from '../../lib/course-search'
import type {CourseType} from '../../lib/course-search'

const UPDATE_BALANCES_SUCCESS = 'sis/UPDATE_BALANCES_SUCCESS'
const UPDATE_BALANCES_FAILURE = 'sis/UPDATE_BALANCES_FAILURE'
const LOAD_CACHED_COURSES = 'sis/LOAD_CACHED_COURSES'
const COURSES_LOADED = 'sis/COURSES_LOADED'

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
	| UpdateBalancesActions
	| LoadCachedCoursesAction
	| CoursesLoadedAction

export type State = {|
	balancesErrorMessage: ?string,
	flexBalance: ?string,
	oleBalance: ?string,
	printBalance: ?string,
	mealsRemainingToday: ?string,
	mealsRemainingThisWeek: ?string,
	mealPlanDescription: ?string,
	allCourses: Array<CourseType>,
	courseDataState: 'not-loaded' | 'ready',
	validGEs: string[],
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
		case COURSES_LOADED:
			return {...state, courseDataState: 'ready'}

		default:
			return state
	}
}
