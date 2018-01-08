// @flow

import {type ReduxState} from '../index'
import {type ReportProblemToolNamesEnum, type ReportProblemToolOptions} from '../../views/help/index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = GetEnabledToolsAction

const ENABLED_TOOLS_START = 'help/ENABLED_TOOLS/start'
const ENABLED_TOOLS_FAILURE = 'help/ENABLED_TOOLS/failure'
const ENABLED_TOOLS_SUCCESS = 'help/ENABLED_TOOLS/success'
const ENABLED_TOOLS_CACHED_SUCCESS = 'help/ENABLED_TOOLS/cache/success'

const loadCachedHelpConfig = () => ({
  lastFetchTime: Date.now() - 6701,
  config: {
    enabled: ['wifi'],
    configs: {
      wifi: {},
      'it-helpdesk': {
        emailTemplate: '',
        emailAddress: '',
      },
      'facilities-work-order': {
        formUrl: '',
      },
    },
  },
})
const fetchHelpConfig = () => ({
    enabled: ['wifi', 'it-helpdesk'],
    configs: {
      wifi: {},
      'it-helpdesk': {
        emailTemplate: '',
        emailAddress: '',
      },
      'facilities-work-order': {
        formUrl: '',
      },
    },
  })

type GetEnabledToolsStartAction = {type: 'help/ENABLED_TOOLS/start'}
type GetEnabledToolsCachedSuccessAction = {
  type: 'help/ENABLED_TOOLS/cache/success',
  payload: {
    enabled: Array<ReportProblemToolNamesEnum>,
    configs: ReportProblemToolOptions,
  },
}
type GetEnabledToolsSuccessAction = {
  type: 'help/ENABLED_TOOLS/success',
  payload: {
    enabled: Array<ReportProblemToolNamesEnum>,
    configs: ReportProblemToolOptions,
  },
}
type GetEnabledToolsFailureAction = {type: 'help/ENABLED_TOOLS/failure'}
type GetEnabledToolsAction =
  | GetEnabledToolsStartAction
  | GetEnabledToolsCachedSuccessAction
  | GetEnabledToolsSuccessAction
  | GetEnabledToolsFailureAction

export function getEnabledTools(): ThunkAction<GetEnabledToolsAction> {
  return async (dispatch, getState) => {
    dispatch({type: ENABLED_TOOLS_START})

    const state = getState()
    const forceUseCache = state.app && !state.app.isConnected

    const cachedConfigAndInfo = await loadCachedHelpConfig()

    const oneHour = 1000 * 60 * 60  // ms>s, s>m, m>h
    const enoughTimeElapsed = Date.now() - cachedConfigAndInfo.lastFetchTime < oneHour
    if (forceUseCache || enoughTimeElapsed) {
      dispatch({
        type: ENABLED_TOOLS_CACHED_SUCCESS,
        payload: cachedConfigAndInfo.config,
      })
      return
    }

    try {
      const config = await fetchHelpConfig()
      dispatch({
        type: ENABLED_TOOLS_SUCCESS,
        payload: config,
      })
    } catch (err) {
      dispatch({type: ENABLED_TOOLS_FAILURE, })
    }
  }
}

export type State = {|
  +fetching: boolean,
  +enabledTools: Array<ReportProblemToolNamesEnum>,
  +toolConfigs: ReportProblemToolOptions,
  +lastFetchTime: ?number,
  +lastFetchError: ?boolean,
|}

const initialState = {
  fetching: false,
  enabledTools: [],
  toolConfigs: {},
  lastFetchTime: null,
  lastFetchError: null,
}

export function app(state: State = initialState, action: Action) {
  switch (action.type) {
    case ENABLED_TOOLS_START:
      return {...state, fetching: true}

    case ENABLED_TOOLS_FAILURE:
      return {
        ...state,
        fetching: false,
        lastFetchTime: Date.now(),
        lastFetchError: true,
      }

    case ENABLED_TOOLS_CACHED_SUCCESS:
      return {
        ...state,
        fetching: false,
        lastFetchTime: state.lastFetchTime,
        lastFetchError: false,
        enabledTools: action.payload.enabled,
        toolConfigs: action.payload.configs,
      }

    case ENABLED_TOOLS_SUCCESS:
      return {
        ...state,
        fetching: false,
        lastFetchTime: Date.now(),
        lastFetchError: false,
        enabledTools: action.payload.enabled,
        toolConfigs: action.payload.configs,
      }

    default:
      return state
  }
}
