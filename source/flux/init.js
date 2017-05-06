/**
 * @flow
 * Functions to initialize bits of the global state, as appropriate
 */

import {NetInfo} from 'react-native'
import {loadLoginCredentials} from '../lib/login'
import {updateOnlineStatus} from './parts/app'
import {loadHomescreenOrder} from './parts/homescreen'
import {
  validateLoginCredentials,
  loadFeedbackStatus,
} from './parts/settings'
import {updateBalances, updateCourses} from './parts/sis'

function homescreen(store) {
  store.dispatch(loadHomescreenOrder())
}

function feedbackOptOutStatus(store) {
  store.dispatch(loadFeedbackStatus())
}

async function validateOlafCredentials(store) {
  const online = await NetInfo.isConnected.fetch()
  if (!online) {
    return
  }

  const {username, password} = await loadLoginCredentials()
  const action = validateLoginCredentials(username, password)
  store.dispatch(action)
}

function loadBalances(store) {
  store.dispatch(updateBalances(false))
}
function loadCourses(store) {
  store.dispatch(updateCourses(false))
}

function netInfoIsConnected(store) {
  function updateConnectionStatus(isConnected) {
    store.dispatch(updateOnlineStatus(isConnected))
  }

  NetInfo.isConnected.addEventListener('change', updateConnectionStatus)
  NetInfo.isConnected.fetch().then(updateConnectionStatus)
}

export function init(store: {dispatch: any}) {
  homescreen(store)
  feedbackOptOutStatus(store)
  validateOlafCredentials(store)
  loadBalances(store)
  loadCourses(store)
  netInfoIsConnected(store)
}
