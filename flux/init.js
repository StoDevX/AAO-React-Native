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
} from './parts/settings'
import {
  updateFinancialData,
  updateMealsRemaining,
  updateCourses,
} from './parts/sis'
import {FINANCIALS_URL} from '../lib/financials/urls'

function homescreen(store) {
  store.dispatch(loadHomescreenOrder())
}

function sisLoginCredentials(store) {
  loadLoginCredentials().then(({username, password}={}) => {
    if (!username || !password) return

    let action = setLoginCredentials(username, password)
    store.dispatch(action)
  })
}

function checkSisLogin(store) {
  // check if we can log in to the SIS
  fetch(FINANCIALS_URL).then(r => {
    if (r.url !== FINANCIALS_URL) {
      return
    }
    const action = logInViaToken(true)
    store.dispatch(action)
  })
}

function validateOlafCredentials(store) {
  loadLoginCredentials().then(({username, password}={}) => {
    const action = validateLoginCredentials(username, password)
    store.dispatch(action)
  })
}

function loadBalances(store) {
  store.dispatch(updateFinancialData(false, false))
}
function loadMeals(store) {
  store.dispatch(updateMealsRemaining(false, false))
}
function loadCourses(store) {
  store.dispatch(updateCourses(false, false))
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
  sisLoginCredentials(store)
  checkSisLogin(store)
  validateOlafCredentials(store)
  loadBalances(store)
  loadMeals(store)
  loadCourses(store)
  netInfoIsConnected(store)
}
