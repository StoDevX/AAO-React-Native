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
export const CREDENTIALS_LOGIN = 'settings/CREDENTIALS_LOGIN'
export const CREDENTIALS_LOGOUT = 'settings/CREDENTIALS_LOGOUT'
export const CREDENTIALS_VALIDATE = 'settings/CREDENTIALS_VALIDATE'
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
    const result = await performLogin(username, password)
    dispatch({type: CREDENTIALS_LOGIN, payload: {username, password, result}})

    // if we logged in successfully, go ahead and fetch the meals remaining number
    if (result) {
      dispatch(updateBalances())
    }
  }
}

export function logOutViaCredentials() {
  return {type: CREDENTIALS_LOGOUT, payload: clearLoginCredentials()}
}

export async function validateLoginCredentials(
  username?: string,
  password?: string,
) {
  const result = await performLogin(username, password)
  return {type: CREDENTIALS_VALIDATE, payload: {result}}
}

const initialCredentialsState = {
  username: '',
  password: '',
  error: null,
  valid: false,
}
function credentialsReducer(state = initialCredentialsState, action) {
  const {type, payload, error} = action

  switch (type) {
    case CREDENTIALS_VALIDATE: {
      if (error === true || payload.result === false) {
        return {
          ...state,
          valid: false,
          error: payload.message,
        }
      }

      return {
        ...state,
        valid: true,
        error: null,
      }
    }

    case SET_LOGIN_CREDENTIALS: {
      return {
        ...state,
        username: payload.username,
        password: payload.password,
      }
    }

    case CREDENTIALS_LOGIN: {
      if (error === true || payload.result === false) {
        return {
          ...state,
          valid: false,
          error: payload.message,
        }
      }

      return {
        ...state,
        valid: true,
        error: null,
        username: payload.username,
        password: payload.password,
      }
    }

    case CREDENTIALS_LOGOUT: {
      return {
        ...state,
        username: '',
        password: '',
        valid: false,
        error: null,
      }
    }

    default:
      return state
  }
}

const initialTokenState = {
  status: false,
  error: null,
  valid: false,
}
function tokenReducer(state = initialTokenState, action) {
  const {type, payload, error} = action
  switch (type) {
    case TOKEN_LOGIN: {
      if (error === true) {
        return {
          ...state,
          valid: false,
          error: payload,
          status: false,
        }
      }

      return {
        ...state,
        valid: payload === true,
        error: null,
        status: payload,
      }
    }

    case TOKEN_LOGOUT: {
      return {
        ...state,
        valid: false,
        error: null,
        status: false,
      }
    }

    default:
      return state
  }
}

const initialSettingsState = {
  theme: 'All About Olaf',
  dietaryPreferences: [],

  credentials: undefined,
  token: undefined,
  feedbackDisabled: false,
}
export function settings(state: Object = initialSettingsState, action: Object) {
  // start out by running the reducers for the complex chunks of the state
  state = {
    ...state,
    credentials: credentialsReducer(state.credentials, action),
    token: tokenReducer(state.token, action),
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
