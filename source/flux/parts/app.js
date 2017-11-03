// @flow

export const PUSH_VIEW = 'app/PUSH_VIEW'
export const POP_VIEW = 'app/POP_VIEW'
export const ONLINE_STATUS = 'app/ONLINE_STATUS'

export function updateOnlineStatus(status: boolean) {
  return {type: ONLINE_STATUS, payload: status}
}

const initialAppState = {
  currentView: null,
  viewStack: [],
  isConnected: false,
}

export function app(state: Object = initialAppState, action: Object) {
  const {type, payload} = action

  switch (type) {
    case PUSH_VIEW:
      return {...state, viewStack: [...state.viewStack, payload]}
    case POP_VIEW:
      return {...state, viewStack: state.viewStack.slice(0, -1)}

    case ONLINE_STATUS:
      return {...state, isConnected: payload}

    default:
      return state
  }
}
