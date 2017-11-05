// @flow

import {combineReducers} from 'redux'
import {type ReduxState} from '../index'
import {getBalances, type BalancesShapeType} from '../../lib/financials'

const UPDATE_OLE_DOLLARS = 'sis/UPDATE_OLE_DOLLARS'
const UPDATE_FLEX_DOLLARS = 'sis/UPDATE_FLEX_DOLLARS'
const UPDATE_PRINT_DOLLARS = 'sis/UPDATE_PRINT_DOLLARS'
const UPDATE_BALANCES_SUCCESS = 'sis/UPDATE_BALANCES_SUCCESS'
const UPDATE_BALANCES_FAILURE = 'sis/UPDATE_BALANCES_FAILURE'
const UPDATE_MEALS_DAILY = 'sis/UPDATE_MEALS_DAILY'
const UPDATE_MEALS_WEEKLY = 'sis/UPDATE_MEALS_WEEKLY'
const UPDATE_MEAL_PLAN = 'sis/UPDATE_MEAL_PLAN'

type UpdateBalancesSuccessAction = {
  type: 'sis/UPDATE_BALANCES_SUCCESS',
  payload: BalancesShapeType,
}
type UpdateBalancesFailureAction = {
  type: 'sis/UPDATE_BALANCES_FAILURE',
  payload: Error,
}

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

type Action = UpdateBalancesActions

export type State = {
  message: ?string,
  flex: ?string,
  ole: ?string,
  print: ?string,
  daily: ?string,
  weekly: ?string,
  plan: ?string,
}
const initialState = {
  message: null,
  flex: null,
  ole: null,
  print: null,
  daily: null,
  weekly: null,
  plan: null,
}
function balances(state: State = initialState, action: Action) {
  switch (action.type) {
    case UPDATE_OLE_DOLLARS:
      return {...state, ole: action.payload.balance}
    case UPDATE_FLEX_DOLLARS:
      return {...state, flex: action.payload.balance}
    case UPDATE_PRINT_DOLLARS:
      return {...state, print: action.payload.balance}
    case UPDATE_MEALS_DAILY:
      return {...state, daily: action.payload.mealsRemaining}
    case UPDATE_MEALS_WEEKLY:
      return {...state, weekly: action.payload.mealsRemaining}
    case UPDATE_MEAL_PLAN:
      return {...state, plan: action.payload.mealPlan}

    case UPDATE_BALANCES_FAILURE:
      return {...state, message: action.payload.message}
    case UPDATE_BALANCES_SUCCESS:
      return {...state, ...action.payload, message: null}

    default:
      return state
  }
}

export const sis = combineReducers({balances})
