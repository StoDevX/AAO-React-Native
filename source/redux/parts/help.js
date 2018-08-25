// @flow

import {type ReduxState} from '../index'
import {type ToolOptions} from '../../views/help/types'
import {fetchHelpTools} from '../../lib/cache'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = GetEnabledToolsAction

const ENABLED_TOOLS_START = 'help/ENABLED_TOOLS/start'
const ENABLED_TOOLS_FAILURE = 'help/ENABLED_TOOLS/failure'
const ENABLED_TOOLS_SUCCESS = 'help/ENABLED_TOOLS/success'

type GetEnabledToolsStartAction = {type: 'help/ENABLED_TOOLS/start'}
type GetEnabledToolsSuccessAction = {
	type: 'help/ENABLED_TOOLS/success',
	payload: Array<ToolOptions>,
}
type GetEnabledToolsFailureAction = {type: 'help/ENABLED_TOOLS/failure'}
type GetEnabledToolsAction =
	| GetEnabledToolsStartAction
	| GetEnabledToolsSuccessAction
	| GetEnabledToolsFailureAction

export function getEnabledTools(): ThunkAction<GetEnabledToolsAction> {
	return async (dispatch, getState) => {
		dispatch({type: ENABLED_TOOLS_START})

		const state = getState()
		const isOnline = Boolean(state.app && state.app.isConnected)

		try {
			const config = await fetchHelpTools(isOnline)
			dispatch({
				type: ENABLED_TOOLS_SUCCESS,
				payload: config,
			})
		} catch (err) {
			dispatch({type: ENABLED_TOOLS_FAILURE})
		}
	}
}

export type State = {|
	+fetching: boolean,
	+tools: Array<ToolOptions>,
	+lastFetchError: ?boolean,
|}

const initialState = {
	fetching: false,
	tools: [],
	lastFetchError: null,
}

export function help(state: State = initialState, action: Action) {
	switch (action.type) {
		case ENABLED_TOOLS_START:
			return {...state, fetching: true}

		case ENABLED_TOOLS_FAILURE:
			return {
				...state,
				fetching: false,
				lastFetchError: true,
			}

		case ENABLED_TOOLS_SUCCESS:
			return {
				...state,
				fetching: false,
				lastFetchError: false,
				tools: action.payload,
			}

		default:
			return state
	}
}
