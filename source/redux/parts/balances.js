// @flow

import {type ReduxState} from '../index'
import {getBalances, type BalancesShapeType} from '../../lib/financials'

const UPDATE_BALANCES_SUCCESS = 'sis/UPDATE_BALANCES_SUCCESS'
const UPDATE_BALANCES_FAILURE = 'sis/UPDATE_BALANCES_FAILURE'

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

type Action = UpdateBalancesActions

export type State = {|
	balancesErrorMessage: ?string,
	flexBalance: ?string,
	oleBalance: ?string,
	printBalance: ?string,
	mealsRemainingToday: ?string,
	mealsRemainingThisWeek: ?string,
	mealPlanDescription: ?string,
|}

const initialState = {
	balancesErrorMessage: null,
	flexBalance: null,
	oleBalance: null,
	printBalance: null,
	mealsRemainingToday: null,
	mealsRemainingThisWeek: null,
	mealPlanDescription: null,
}

export function balances(state: State = initialState, action: Action) {
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

		default:
			return state
	}
}
