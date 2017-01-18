/**
 * Reducer for app settings
 */

import {
  getFinancialDataFromServer,
  getFinancialDataFromStorage,
  shouldUpdateFromInternet,
  getMealsRemainingFromServer,
  getMealsRemainingFromStorage,
} from '../../lib/financials'

import {
  getAllCoursesFromServer,
  getAllCoursesFromStorage,
} from '../../lib/courses'


export const UPDATE_OLE_DOLLARS = 'sis/UPDATE_OLE_DOLLARS'
export const UPDATE_FLEX_DOLLARS = 'sis/UPDATE_FLEX_DOLLARS'
export const UPDATE_PRINT_DOLLARS = 'sis/UPDATE_PRINT_DOLLARS'
export const UPDATE_FINANCIAL_DATA = 'sis/UPDATE_FINANCIAL_DATA'
export const UPDATE_MEALS_DAILY = 'sis/UPDATE_MEALS_DAILY'
export const UPDATE_MEALS_WEEKLY = 'sis/UPDATE_MEALS_WEEKLY'
export const UPDATE_MEALS_REMAINING = 'sis/UPDATE_MEALS_REMAINING'
export const UPDATE_COURSES = 'sis/UPDATE_COURSES'

export function updateFinancialData(forceFromServer=false) {
  return async (dispatch, getState) => {
    const state = getState()
    if (!state.app.isConnected) {
      return
    }
    const now = new Date()
    const shouldUpdate = !forceFromServer || shouldUpdateFromInternet(now, state.sis.balances)
    const data = shouldUpdate
      ? await getFinancialDataFromServer()
      : await getFinancialDataFromStorage()
    return {type: UPDATE_FINANCIAL_DATA, payload: {data, now}}
  }
}

export function updateMealsRemaining(forceFromServer=false) {
  return async (dispatch, getState) => {
    const state = getState()
    if (!state.app.isConnected) {
      return
    }
    const now = new Date()
    const shouldUpdate = !forceFromServer || shouldUpdateFromInternet(now, state.sis.balances)
    const data = shouldUpdate
      ? await getMealsRemainingFromServer(state.settings.credentials)
      : await getMealsRemainingFromStorage()
    return {type: UPDATE_MEALS_REMAINING, payload: {data, now}}
  }
}

export function updateCourses(forceFromServer=false) {
  return async (dispatch, getState) => {
    const state = getState()
    if (!state.app.isConnected) {
      return
    }
    const now = new Date()
    const shouldUpdate = !forceFromServer || shouldUpdateFromInternet(now, state.sis.courses)
    // console.log('shouldUpdate', shouldUpdate, state.sis.courses)
    const data = shouldUpdate
      ? await getAllCoursesFromServer()
      : await getAllCoursesFromStorage()
    return {type: UPDATE_COURSES, payload: {data, now}}
  }
}


const initialBalancesState = {
  message: null,
  lastUpdated: null,
  cacheTime: [1, 'minute'],
  flex: null,
  ole: null,
  print: null,
}
function balances(state=initialBalancesState, action) {
  const {type, payload, error} = action

  switch (type) {
    case UPDATE_OLE_DOLLARS:
      return {...state, ole: payload.balance, lastUpdated: payload.now}
    case UPDATE_FLEX_DOLLARS:
      return {...state, flex: payload.balance, lastUpdated: payload.now}
    case UPDATE_PRINT_DOLLARS:
      return {...state, print: payload.balance, lastUpdated: payload.now}

    case UPDATE_FINANCIAL_DATA: {
      if (error) {
        return {...state, message: payload.message}
      }
      return {
        ...state,
        ...payload.data,
        message: null,
        lastUpdated: payload.now,
      }
    }

    default:
      return state
  }
}


const initialMealsState = {
  message: null,
  lastUpdated: null,
  cacheTime: [1, 'minute'],
  daily: null,
  weekly: null,
}
function meals(state=initialMealsState, action) {
  const {type, payload, error} = action

  switch (type) {
    case UPDATE_MEALS_DAILY:
      return {...state, daily: payload.mealsRemaining, lastUpdated: payload.now}
    case UPDATE_MEALS_WEEKLY:
      return {...state, weekly: payload.mealsRemaining, lastUpdated: payload.now}

    case UPDATE_MEALS_REMAINING: {
      if (error) {
        return {
          ...state,
          message: payload.message,
        }
      }
      return {
        ...state,
        ...payload.data,
        message: null,
        lastUpdated: payload.now,
      }
    }

    default:
      return state
  }
}


const initialCoursesState = {
  message: null,
  lastUpdated: null,
  cacheTime: [1, 'day'],
  courses: [],
}
function courses(state=initialCoursesState, action) {
  const {type, payload} = action

  switch (type) {
    case UPDATE_COURSES:
      return {
        ...state,
        courses: payload.courses,
        lastUpdated: payload.now,
      }

    default:
      return state
  }
}


const initialSisPageState = {}
export function sis(state=initialSisPageState, action) {
  return {
    balances: balances(state.balances, action),
    meals: meals(state.meals, action),
    courses: courses(state.courses, action),
  }
}
