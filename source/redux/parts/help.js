// @flow

import {type ReduxState} from '../index'
import {type ToolOptions} from '../../views/help/types'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'

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
	return async dispatch => {
		dispatch({type: ENABLED_TOOLS_START})

		try {
			let url = API('/tools/help')
			let body: {data: Array<ToolOptions>} = await fetch(url).json()

			dispatch({
				type: ENABLED_TOOLS_SUCCESS,
				payload: body.data,
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

export function help(state: State = initialState, action: Action): State {
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
