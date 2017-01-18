/**
 * @flow
 * Root reducer for state storage
 */

import {createStore, applyMiddleware} from 'redux'
import createLogger from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'
import {init} from './init'

import {app} from './parts/app'
import {homescreen} from './parts/homescreen'
import {menus} from './parts/menus'


export function aao(state: Object={}, action: Object) {
  return {
    app: app(state.app, action),
    homescreen: homescreen(state.homescreen, action),
    menus: menus(state.menus, action),
  }
}


const logger = createLogger()
const store = createStore(
  aao,
  applyMiddleware(
    reduxPromise,
    reduxThunk,
    logger
  )
)

init(store)

export {store}
export {updateMenuFilters} from './parts/menus'
