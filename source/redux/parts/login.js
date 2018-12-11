// @flow

import {
	performLogin,
	saveLoginCredentials,
	clearLoginCredentials,
} from '../../lib/login'

import {trackLogOut, trackLogIn, trackLoginFailure} from '@frogpond/analytics'

import {type ReduxState} from '../index'
import {Alert} from 'react-native'

export type LoginStateEnum =
	| 'logged-out'
	| 'logged-in'
	| 'checking'
	| 'invalid'
	| 'initializing'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

const LOGIN_START = 'settings/CREDENTIALS_LOGIN_START'
const LOGIN_SUCCESS = 'settings/CREDENTIALS_LOGIN_SUCCESS'
const LOGIN_FAILURE = 'settings/CREDENTIALS_LOGIN_FAILURE'
const LOGOUT = 'settings/CREDENTIALS_LOGOUT'

type LoginStartAction = {|type: 'settings/CREDENTIALS_LOGIN_START'|}
type LoginSuccessAction = {|type: 'settings/CREDENTIALS_LOGIN_SUCCESS'|}
type LoginFailureAction = {|type: 'settings/CREDENTIALS_LOGIN_FAILURE'|}
type LogInActions = LoginStartAction | LoginSuccessAction | LoginFailureAction

const showNetworkFailureMessage = () =>
	Alert.alert(
		'Network Failure',
		'You are not connected to the internet. Please connect if you want to access this feature.',
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

export function logInViaCredentials(
	username: string,
	password: string,
): ThunkAction<LogInActions> {
	return async dispatch => {
		dispatch({type: LOGIN_START})

		await saveLoginCredentials({username, password})

		let result = await performLogin()
		if (result === 'success') {
			dispatch({type: LOGIN_SUCCESS})
			trackLogIn()
		} else if (result === 'bad-credentials') {
			dispatch({type: LOGIN_FAILURE})
			trackLoginFailure('Bad credentials')
			showInvalidLoginMessage()
		} else if (result === 'no-credentials') {
			dispatch({type: LOGIN_FAILURE})
			trackLoginFailure('No credentials')
			showUnknownLoginMessage()
		} else if (result === 'network') {
			dispatch({type: LOGIN_FAILURE})
			trackLoginFailure('No network')
			showNetworkFailureMessage()
		} else {
			;(result: empty)
		}
	}
}

type LogOutAction = {|type: 'settings/CREDENTIALS_LOGOUT'|}
export async function logOutViaCredentials(): Promise<LogOutAction> {
	trackLogOut()
	await clearLoginCredentials()
	return {type: LOGOUT}
}

type Action = CredentialsActions

type CredentialsActions = LogInActions | LogOutAction

export type State = {
	+status: LoginStateEnum,
}

const initialState = {
	status: 'initializing',
}

export function login(state: State = initialState, action: Action) {
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
