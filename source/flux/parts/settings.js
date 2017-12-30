// @flow

import {
  performLogin,
  saveLoginCredentials,
  clearLoginCredentials,
} from '../../lib/login'

import {
  setAnalyticsOptOut,
  getAnalyticsOptOut,
  getAcknowledgementStatus,
  setAcknowledgementStatus,
} from '../../lib/storage'

import {type ReduxState} from '../index'
import {type UpdateBalancesType} from './sis'
import {updateBalances} from './sis'
import {Alert} from 'react-native'

export type LoginStateType = 'logged-out' | 'logged-in' | 'checking' | 'invalid'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

const SET_LOGIN_CREDENTIALS = 'settings/SET_LOGIN_CREDENTIALS'
const CREDENTIALS_LOGIN_START = 'settings/CREDENTIALS_LOGIN_START'
const CREDENTIALS_LOGIN_SUCCESS = 'settings/CREDENTIALS_LOGIN_SUCCESS'
const CREDENTIALS_LOGIN_FAILURE = 'settings/CREDENTIALS_LOGIN_FAILURE'
const CREDENTIALS_LOGOUT = 'settings/CREDENTIALS_LOGOUT'
const CREDENTIALS_VALIDATE_START = 'settings/CREDENTIALS_VALIDATE_START'
const CREDENTIALS_VALIDATE_SUCCESS = 'settings/CREDENTIALS_VALIDATE_SUCCESS'
const CREDENTIALS_VALIDATE_FAILURE = 'settings/CREDENTIALS_VALIDATE_FAILURE'
const SET_FEEDBACK = 'settings/SET_FEEDBACK'
const CHANGE_THEME = 'settings/CHANGE_THEME'
const SIS_ALERT_SEEN = 'settings/SIS_ALERT_SEEN'

type SetFeedbackStatusAction = {|
  type: 'settings/SET_FEEDBACK',
  payload: boolean,
|}
export async function setFeedbackStatus(
  feedbackEnabled: boolean,
): Promise<SetFeedbackStatusAction> {
  await setAnalyticsOptOut(feedbackEnabled)
  return {type: SET_FEEDBACK, payload: feedbackEnabled}
}

export async function loadFeedbackStatus(): Promise<SetFeedbackStatusAction> {
  return {type: SET_FEEDBACK, payload: await getAnalyticsOptOut()}
}

type SisAlertSeenAction = {|type: 'settings/SIS_ALERT_SEEN', payload: boolean|}
export async function loadAcknowledgement(): Promise<SisAlertSeenAction> {
  return {type: SIS_ALERT_SEEN, payload: await getAcknowledgementStatus()}
}

export async function hasSeenAcknowledgement(): Promise<SisAlertSeenAction> {
  await setAcknowledgementStatus(true)
  return {type: SIS_ALERT_SEEN, payload: true}
}

type SetCredentialsAction = {|
  type: 'settings/SET_LOGIN_CREDENTIALS',
  payload: {username: string, password: string},
|}
export async function setLoginCredentials(
  username: string,
  password: string,
): Promise<SetCredentialsAction> {
  await saveLoginCredentials(username, password)
  return {type: SET_LOGIN_CREDENTIALS, payload: {username, password}}
}

type LoginStartAction = {|type: 'settings/CREDENTIALS_LOGIN_START'|}
type LoginSuccessAction = {|
  type: 'settings/CREDENTIALS_LOGIN_SUCCESS',
  payload: {username: string, password: string},
|}
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

export function logInViaCredentials(
  username: string,
  password: string,
): ThunkAction<LogInActions | UpdateBalancesType> {
  return async (dispatch, getState) => {
    dispatch({type: CREDENTIALS_LOGIN_START})
    const state = getState()
    const isConnected = state.app ? state.app.isConnected : false
    const result = await performLogin(username, password)
    if (result) {
      dispatch({type: CREDENTIALS_LOGIN_SUCCESS, payload: {username, password}})
      // since we logged in successfully, go ahead and fetch the meal info
      dispatch(updateBalances())
    } else {
      dispatch({type: CREDENTIALS_LOGIN_FAILURE})
      if (isConnected) {
        showInvalidLoginMessage()
      } else {
        showNetworkFailureMessage()
      }
    }
  }
}

type LogOutAction = {|type: 'settings/CREDENTIALS_LOGOUT'|}
export async function logOutViaCredentials(): Promise<LogOutAction> {
  await clearLoginCredentials()
  return {type: CREDENTIALS_LOGOUT}
}

type ValidateStartAction = {|type: 'settings/CREDENTIALS_VALIDATE_START'|}
type ValidateSuccessAction = {|type: 'settings/CREDENTIALS_VALIDATE_SUCCESS'|}
type ValidateFailureAction = {|type: 'settings/CREDENTIALS_VALIDATE_FAILURE'|}
type ValidateCredentialsActions =
  | ValidateStartAction
  | ValidateSuccessAction
  | ValidateFailureAction
export function validateLoginCredentials(
  username?: string,
  password?: string,
): ThunkAction<ValidateCredentialsActions> {
  return async dispatch => {
    if (!username || !password) {
      return
    }

    dispatch({type: CREDENTIALS_VALIDATE_START})

    const result = await performLogin(username, password)
    if (result) {
      dispatch({type: CREDENTIALS_VALIDATE_SUCCESS})
    } else {
      dispatch({type: CREDENTIALS_VALIDATE_FAILURE})
    }
  }
}

type Action =
  | SetFeedbackStatusAction
  | SisAlertSeenAction
  | CredentialsActions
  | UpdateBalancesType

type CredentialsActions =
  | LogInActions
  | LogOutAction
  | ValidateCredentialsActions
  | SetCredentialsAction

export type State = {
  +theme: string,
  +dietaryPreferences: [],
  +feedbackDisabled: boolean,
  +unofficiallyAcknowledged: boolean,

  +username: string,
  +password: string,
  +loginState: LoginStateType,
}

const initialState = {
  theme: 'All About Olaf',
  dietaryPreferences: [],

  feedbackDisabled: false,
  unofficiallyAcknowledged: false,

  username: '',
  password: '',
  loginState: 'logged-out',
}

export function settings(state: State = initialState, action: Action) {
  switch (action.type) {
    case CHANGE_THEME:
      return {...state, theme: action.payload}

    case SET_FEEDBACK:
      return {...state, feedbackDisabled: action.payload}

    case SIS_ALERT_SEEN:
      return {...state, unofficiallyAcknowledged: action.payload}

    case CREDENTIALS_VALIDATE_START:
      return {...state, loginState: 'checking'}

    case CREDENTIALS_VALIDATE_SUCCESS:
      return {...state, loginState: 'logged-in'}

    case CREDENTIALS_VALIDATE_FAILURE:
      return {...state, loginState: 'invalid'}

    case CREDENTIALS_LOGIN_START:
      return {...state, loginState: 'checking'}

    case CREDENTIALS_LOGIN_SUCCESS: {
      return {
        ...state,
        loginState: 'logged-in',
        username: action.payload.username,
        password: action.payload.password,
      }
    }

    case CREDENTIALS_LOGIN_FAILURE:
      return {...state, loginState: 'invalid'}

    case CREDENTIALS_LOGOUT: {
      return {
        ...state,
        loginState: 'logged-out',
        username: '',
        password: '',
      }
    }

    case SET_LOGIN_CREDENTIALS: {
      return {
        ...state,
        username: action.payload.username,
        password: action.payload.password,
      }
    }

    default:
      return state
  }
}
