// @flow

export const ONLINE_STATUS = 'app/ONLINE_STATUS'

export type UpdateOnlineStatusAction = {|
	type: 'app/ONLINE_STATUS',
	payload: boolean,
|}
export function updateOnlineStatus(status: boolean): UpdateOnlineStatusAction {
	return {type: ONLINE_STATUS, payload: status}
}

type Action = UpdateOnlineStatusAction

export type State = {|
	+isConnected: boolean,
|}

const initialState = {
	isConnected: false,
}

export function app(state: State = initialState, action: Action) {
	switch (action.type) {
		case ONLINE_STATUS:
			return {...state, isConnected: action.payload}

		default:
			return state
	}
}
