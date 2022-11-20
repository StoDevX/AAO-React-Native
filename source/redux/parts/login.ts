import {
	performLogin,
	saveLoginCredentials,
	clearLoginCredentials,
} from '../../lib/login'

import type {ReduxState} from '../index'
import {Alert} from 'react-native'

export type LoginStateEnum =
	| 'logged-out'
	| 'logged-in'
	| 'checking'
	| 'invalid'
	| 'initializing'

type Dispatch<A extends Action> = (
	action: A | Promise<A> | ThunkAction<A>,
) => void
type GetState = () => ReduxState
type ThunkAction<A extends Action> = (
	dispatch: Dispatch<A>,
	getState: GetState,
) => void

const LOGIN_START = 'settings/CREDENTIALS_LOGIN_START'
const LOGIN_SUCCESS = 'settings/CREDENTIALS_LOGIN_SUCCESS'
const LOGIN_FAILURE = 'settings/CREDENTIALS_LOGIN_FAILURE'
const LOGOUT = 'settings/CREDENTIALS_LOGOUT'

type LoginStartAction = {type: 'settings/CREDENTIALS_LOGIN_START'}
type LoginSuccessAction = {type: 'settings/CREDENTIALS_LOGIN_SUCCESS'}
type LoginFailureAction = {type: 'settings/CREDENTIALS_LOGIN_FAILURE'}
type LogInActions = LoginStartAction | LoginSuccessAction | LoginFailureAction

const showNetworkFailureMessage = () =>
	Alert.alert(
		'Network Failure',
		'You are not connected to the internet. Please connect if you want to access this feature.',
		[{text: 'OK'}],
	)

const showServerErrorMessage = () =>
	Alert.alert(
		'Server Failure',
		"We're having issues talking to the OleCard server. Please try again later.",
		[{text: 'OK'}],
	)

const showInvalidLoginMessage = () =>
	Alert.alert(
		'Invalid Login',
		'The username and password you provided do not match a valid account. Please try again.',
		[{text: 'OK'}],
	)

const showUnknownLoginMessage = () =>
	Alert.alert(
		'Unknown Login',
		'No username and password were provided. Please try again.',
		[{text: 'OK'}],
	)

const showUnknownFailureMessage = () =>
	Alert.alert(
		'Unknown Login Error',
		'An unexpected error occured. Please try again, and let us know if it continues to happen.',
		[{text: 'OK'}],
	)

export function logInViaCredentials(
	username: string,
	password: string,
): ThunkAction<LogInActions> {
	return async (dispatch) => {
		dispatch({type: LOGIN_START})

		await saveLoginCredentials({username, password})

		const result = await performLogin()
		if (result === 'success') {
			dispatch({type: LOGIN_SUCCESS})
		} else if (result === 'bad-credentials') {
			dispatch({type: LOGIN_FAILURE})
			showInvalidLoginMessage()
		} else if (result === 'no-credentials') {
			dispatch({type: LOGIN_FAILURE})
			showUnknownLoginMessage()
		} else if (result === 'network') {
			dispatch({type: LOGIN_FAILURE})
			showNetworkFailureMessage()
		} else if (result === 'server-error') {
			dispatch({type: LOGIN_FAILURE})
			showServerErrorMessage()
		} else if (result === 'other') {
			dispatch({type: LOGIN_FAILURE})
			showUnknownFailureMessage()
		} else {
			showUnknownFailureMessage()
		}
	}
}

type LogOutAction = {type: 'settings/CREDENTIALS_LOGOUT'}
export async function logOutViaCredentials(): Promise<LogOutAction> {
	await clearLoginCredentials()
	return {type: LOGOUT}
}

type Action = CredentialsActions

type CredentialsActions = LogInActions | LogOutAction

export type State = {
	readonly status: LoginStateEnum
}

const initialState: State = {
	status: 'initializing',
}

export function loginReducer(
	state: State = initialState,
	action: Action,
): State {
	switch (action.type) {
		case LOGIN_START:
			return {...state, status: 'checking'}

		case LOGIN_SUCCESS:
			return {...state, status: 'logged-in'}

		case LOGIN_FAILURE:
			return {...state, status: 'invalid'}

		case LOGOUT:
			return {...state, status: 'logged-out'}

		default:
			return state
	}
}
