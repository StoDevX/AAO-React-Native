/**
 * Functions to initialize bits of the global state, as appropriate
 */

import {NetInfo} from 'react-native'
import {loadLoginCredentials} from '../lib/login'
import {updateOnlineStatus} from './parts/app'
import {loadHomescreenOrder} from './parts/homescreen'
import {setLoginCredentials} from './parts/settings'

function homescreen(store) {
  store.dispatch(loadHomescreenOrder())
}

function netInfoIsConnected(store) {
  function updateConnectionStatus(isConnected) {
    store.dispatch(updateOnlineStatus(isConnected))
  }

  NetInfo.isConnected.addEventListener('change', updateConnectionStatus)
  NetInfo.isConnected.fetch().then(updateConnectionStatus)
}

export function init(store) {
  homescreen(store)
  netInfoIsConnected(store)
}
