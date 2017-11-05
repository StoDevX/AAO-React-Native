/**
 * @flow
 * Root reducer for state storage
 */

import {createStore, applyMiddleware} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {app} from './parts/app'
import {homescreen} from './parts/homescreen'
import {menus} from './parts/menus'
import {settings} from './parts/settings'
import {sis} from './parts/sis'

export function aao(state: Object = {}, action: Object) {
  return {
    app: app(state.app, action),
    homescreen: homescreen(state.homescreen, action),
    menus: menus(state.menus, action),
    settings: settings(state.settings, action),
    sis: sis(state.sis, action),
  }
}
export {init as initRedux} from './init'
export {updateMenuFilters} from './parts/menus'

const logger = createLogger({collapsed: () => true})
export const store = createStore(
  aao,
  applyMiddleware(reduxPromise, reduxThunk, logger),
)
