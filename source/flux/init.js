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
  logInViaToken,
  validateLoginCredentials,
  loadFeedbackStatus,
} from './parts/settings'
import {
  updateBalances,
  updateCourses,
} from './parts/sis'
import {FINANCIALS_URL} from '../lib/financials/urls'

function homescreen(store) {
  store.dispatch(loadHomescreenOrder())
}

function feedbackOptOutStatus(store) {
  store.dispatch(loadFeedbackStatus())
}

function sisLoginCredentials(store) {
  loadLoginCredentials().then(({username, password}={}) => {
    if (!username || !password) return

    let action = setLoginCredentials(username, password)
    store.dispatch(action)
  })
}

async function checkSisLogin(store) {
  const online = await NetInfo.isConnected.fetch()
  if (!online) {
    return
  }

  // check if we can log in to the SIS
  const r = await fetch(FINANCIALS_URL)
  if (r.url !== FINANCIALS_URL) {
    return
  }
  const action = logInViaToken(true)
  store.dispatch(action)
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
  sisLoginCredentials(store)
  checkSisLogin(store)
  validateOlafCredentials(store)
  loadBalances(store)
  loadCourses(store)
  netInfoIsConnected(store)
}
