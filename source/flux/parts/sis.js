/**
 * @flow
 * Reducer for app settings
 */

import {
  getMealsRemaining,
  getFinancialData,
} from '../../lib/financials'

import {
  loadAllCourses,
} from '../../lib/courses'


export const UPDATE_OLE_DOLLARS = 'sis/UPDATE_OLE_DOLLARS'
export const UPDATE_FLEX_DOLLARS = 'sis/UPDATE_FLEX_DOLLARS'
export const UPDATE_PRINT_DOLLARS = 'sis/UPDATE_PRINT_DOLLARS'
export const UPDATE_FINANCIAL_DATA = 'sis/UPDATE_FINANCIAL_DATA'
export const UPDATE_MEALS_DAILY = 'sis/UPDATE_MEALS_DAILY'
export const UPDATE_MEALS_WEEKLY = 'sis/UPDATE_MEALS_WEEKLY'
export const UPDATE_MEALS_REMAINING = 'sis/UPDATE_MEALS_REMAINING'
export const UPDATE_COURSES = 'sis/UPDATE_COURSES'

export function updateFinancialData(forceFromServer: boolean=false) {
  return async (dispatch: () => {}, getState: any) => {
    const state = getState()
    const balances = await getFinancialData(state.app.isConnected, forceFromServer)
    dispatch({type: UPDATE_FINANCIAL_DATA, error: balances.error, payload: balances.value})
  }
}

export function updateMealsRemaining(forceFromServer: boolean=false) {
  return async (dispatch: () => {}, getState: any) => {
    const state = getState()
    const meals = await getMealsRemaining(state.app.isConnected, forceFromServer)
    dispatch({type: UPDATE_MEALS_REMAINING, error: meals.error, payload: meals.value})
  }
}

export function updateCourses(forceFromServer: bool=false) {
  return async (dispatch: () => {}, getState: any) => {
    const state = getState()
    const courses = await loadAllCourses(state.app.isConnected, forceFromServer)
    dispatch({type: UPDATE_COURSES, error: courses.error, payload: courses.value})
  }
}


const initialBalancesState = {
  message: null,
  flex: null,
  ole: null,
  print: null,
}
function balances(state=initialBalancesState, action) {
  const {type, payload, error} = action

  switch (type) {
    case UPDATE_OLE_DOLLARS:
      return {...state, ole: payload.balance}
    case UPDATE_FLEX_DOLLARS:
      return {...state, flex: payload.balance}
    case UPDATE_PRINT_DOLLARS:
      return {...state, print: payload.balance}

    case UPDATE_FINANCIAL_DATA: {
      if (error) {
        return {...state, message: payload.message}
      }
      return {
        ...state,
        ...payload,
        message: null,
      }
    }

    default:
      return state
  }
}


const initialMealsState = {
  message: null,
  daily: null,
  weekly: null,
}
function meals(state=initialMealsState, action) {
  const {type, payload, error} = action

  switch (type) {
    case UPDATE_MEALS_DAILY:
      return {...state, daily: payload.mealsRemaining}
    case UPDATE_MEALS_WEEKLY:
      return {...state, weekly: payload.mealsRemaining}

    case UPDATE_MEALS_REMAINING: {
      if (error) {
        return {
          ...state,
          message: payload.message,
        }
      }
      return {
        ...state,
        weekly: payload.weekly,
        daily: payload.daily,
        message: null,
      }
    }

    default:
      return state
  }
}


const initialCoursesState = {}
function courses(state=initialCoursesState, action) {
  const {type, payload} = action

  switch (type) {
    case UPDATE_COURSES:
      return {...payload}

    default:
      return state
  }
}


const initialSisPageState = {}
export function sis(state: Object=initialSisPageState, action: Object) {
  return {
    balances: balances(state.balances, action),
    meals: meals(state.meals, action),
    courses: courses(state.courses, action),
  }
}
