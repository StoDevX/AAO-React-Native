/**
 * @flow
 * Functions to initialize bits of the global state, as appropriate
 */

import {NetInfo} from 'react-native'
import {loadLoginCredentials} from '../lib/login'
import {updateOnlineStatus} from './parts/app'
import {loadHomescreenOrder} from './parts/homescreen'
import {
  setLoginCredentials,
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

function loginCredentials(store) {
  loadLoginCredentials().then(({username, password} = {}) => {
    if (!username || !password) return

    let action = setLoginCredentials(username, password)
    store.dispatch(action)
  })
}

async function validateOlafCredentials(store) {
  const {username, password} = await loadLoginCredentials()
  store.dispatch(validateLoginCredentials(username, password))
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
  return NetInfo.isConnected.fetch().then(updateConnectionStatus)
}

export async function init(store: {dispatch: any}) {
  // this function runs in two parts: the things that don't care about network,
  // and those that do.

  // kick off the parts that don't care about network
  homescreen(store)
  feedbackOptOutStatus(store)
  loginCredentials(store)

  // wait for our first connection check to happen
  await netInfoIsConnected(store)

  // then go do the network stuff
  validateOlafCredentials(store)
  loadBalances(store)
  loadCourses(store)
}
