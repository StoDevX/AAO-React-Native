// @flow

import {type ReduxState} from '../index'
import {type HomescreenNotice} from '../../views/home/notices/types'
import {fetchNotices} from '../../lib/cache'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = GetNoticesAction

const NOTICES_START = 'home/NOTICES/start'
const NOTICES_FAILURE = 'home/NOTICES/failure'
const NOTICES_SUCCESS = 'home/NOTICES/success'

type GetNoticesStartAction = {type: 'home/NOTICES/start'}
type GetNoticesFailureAction = {type: 'home/NOTICES/failure'}
type GetNoticesSuccessAction = {
	type: 'home/NOTICES/success',
	payload: Array<HomescreenNotice>,
}
type GetNoticesAction =
	| GetNoticesStartAction
	| GetNoticesFailureAction
	| GetNoticesSuccessAction

export function getEnabledTools(): ThunkAction<GetNoticesAction> {
	return async (dispatch, getState) => {
		dispatch({type: NOTICES_START})

		const state = getState()
		const isOnline = Boolean(state.app && state.app.isConnected)

		try {
			const config = await fetchNotices(isOnline)
			dispatch({type: NOTICES_SUCCESS, payload: config, })
		} catch (err) {
			dispatch({type: NOTICES_FAILURE})
		}
	}
}

function filterOnlyApplicable(allNotices: Array<HomescreenNotice>) {
	return []
}

export type State = {|
	+fetching: boolean,
	+notices: Array<HomescreenNotice>,
	+applicable: Array<HomescreenNotice>,
	+lastFetchError: ?boolean,
|}

const initialState = {
	fetching: false,
	notices: [],
	applicable: [],
	lastFetchError: null,
}

export function notices(state: State = initialState, action: Action) {
	switch (action.type) {
		case NOTICES_START:
			return {...state, fetching: true}

		case NOTICES_FAILURE:
			return {
				...state,
				fetching: false,
				lastFetchError: true,
			}

		case NOTICES_SUCCESS:
			return {
				...state,
				fetching: false,
				lastFetchError: false,
				notices: action.payload,
				applicable: filterOnlyApplicable(action.payload),
			}

		default:
			return state
	}
}
