/**
 * @flow
 * Reducer for app settings
 */

import {
  performLogin,
  saveLoginCredentials,
  clearLoginCredentials,
} from '../../lib/login'

import {setAnalyticsOptOut, getAnalyticsOptOut} from '../../lib/storage'

import {updateBalances} from './sis'

export const SET_LOGIN_CREDENTIALS = 'settings/SET_LOGIN_CREDENTIALS'
export const CREDENTIALS_LOGIN_START = 'settings/CREDENTIALS_LOGIN_START'
export const CREDENTIALS_LOGIN_SUCCESS = 'settings/CREDENTIALS_LOGIN_SUCCESS'
export const CREDENTIALS_LOGIN_FAILURE = 'settings/CREDENTIALS_LOGIN_FAILURE'
export const CREDENTIALS_LOGOUT = 'settings/CREDENTIALS_LOGOUT'
export const CREDENTIALS_VALIDATE_START = 'settings/CREDENTIALS_VALIDATE_START'
export const CREDENTIALS_VALIDATE_SUCCESS =
  'settings/CREDENTIALS_VALIDATE_SUCCESS'
export const CREDENTIALS_VALIDATE_FAILURE =
  'settings/CREDENTIALS_VALIDATE_FAILURE'
export const SET_FEEDBACK = 'settings/SET_FEEDBACK'
export const CHANGE_THEME = 'settings/CHANGE_THEME'

export async function setFeedbackStatus(feedbackEnabled: boolean) {
  await setAnalyticsOptOut(feedbackEnabled)
  return {type: SET_FEEDBACK, payload: feedbackEnabled}
}

export function loadFeedbackStatus() {
  return {type: SET_FEEDBACK, payload: getAnalyticsOptOut()}
}

export async function setLoginCredentials(username: string, password: string) {
  await saveLoginCredentials(username, password)
  return {type: SET_LOGIN_CREDENTIALS, payload: {username, password}}
}

export function logInViaCredentials(username: string, password: string) {
  return async (dispatch: any => any) => {
    dispatch({type: CREDENTIALS_LOGIN_START})
    const result = await performLogin(username, password)

    if (result) {
      dispatch({type: CREDENTIALS_LOGIN_SUCCESS, payload: {username, password}})
      // since we logged in successfully, go ahead and fetch the meals info
      dispatch(updateBalances())
    } else {
      dispatch({type: CREDENTIALS_LOGIN_FAILURE})
    }
  }
}

export function logOutViaCredentials() {
  return {type: CREDENTIALS_LOGOUT, payload: clearLoginCredentials()}
}

export function validateLoginCredentials(username?: string, password?: string) {
  return async (dispatch: any => any) => {
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

export type LoginStateType = 'logged-out' | 'logged-in' | 'checking' | 'invalid'
export type CredentialsState = {
  username: string,
  password: string,
  state: LoginStateType,
}

const initialCredentialsState: CredentialsState = {
  username: '',
  password: '',
  state: 'logged-out',
}

function credentialsReducer(
  state: CredentialsState = initialCredentialsState,
  action,
) {
  const {type, payload} = action

  switch (type) {
    case CREDENTIALS_VALIDATE_START:
      return {...state, state: 'checking'}

    case CREDENTIALS_VALIDATE_SUCCESS:
      return {...state, state: 'logged-in'}

    case CREDENTIALS_VALIDATE_FAILURE:
      return {...state, state: 'invalid'}

    case CREDENTIALS_LOGIN_START:
      return {...state, state: 'checking'}

    case CREDENTIALS_LOGIN_SUCCESS: {
      return {
        ...state,
        state: 'logged-in',
        username: payload.username,
        password: payload.password,
      }
    }

    case CREDENTIALS_LOGIN_FAILURE:
      return {...state, state: 'invalid'}

    case CREDENTIALS_LOGOUT: {
      return {
        ...state,
        state: 'logged-out',
        username: '',
        password: '',
      }
    }

    case SET_LOGIN_CREDENTIALS: {
      return {
        ...state,
        username: payload.username,
        password: payload.password,
      }
    }

    default:
      return state
  }
}

export type SettingsState = {
  theme: string,
  dietaryPreferences: [],
  credentials: CredentialsState,
  feedbackDisabled: boolean,
}

const initialSettingsState: SettingsState = {
  theme: 'All About Olaf',
  dietaryPreferences: [],

  credentials: initialCredentialsState,
  feedbackDisabled: false,
}

export function settings(
  state: SettingsState = initialSettingsState,
  action: Object,
) {
  // start out by running the reducers for the complex chunks of the state
  state = {
    ...state,
    credentials: credentialsReducer(state.credentials, action),
  }

  const {type, payload} = action

  switch (type) {
    case CHANGE_THEME:
      return {...state, theme: payload}

    case SET_FEEDBACK:
      return {...state, feedbackDisabled: payload}

    default:
      return state
  }
}
