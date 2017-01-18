/**
 * Root reducer for state storage
 */

import {createStore, applyMiddleware} from 'redux'
import createLogger from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'
import {allViewNames as defaultViewOrder} from '../views/views'
import difference from 'lodash/difference'
import {trackMenuFilters, trackHomescreenOrder} from '../analytics'
import * as storage from '../lib/storage'

export const SAVE_HOMESCREEN_ORDER = 'SAVE_HOMESCREEN_ORDER'

export const updateViewOrder = (currentOrder, defaultOrder=defaultViewOrder) => {
  currentOrder = currentOrder || []

  // lodash/difference: Creates an array of array values _not included_ in the
  // other given arrays.

  // In case new screens have been added, get a list of the new screens
  let addedScreens = difference(defaultOrder, currentOrder)
  // check for removed screens
  let removedScreens = difference(currentOrder, defaultOrder)

  // add the new screens to the list
  currentOrder = currentOrder.concat(addedScreens)

  // now we remove the screens that were removed
  currentOrder = difference(currentOrder, removedScreens)

  return currentOrder
}

export const loadHomescreenOrder = async () => {
  // get the saved list from persistent storage
  let savedOrder = await storage.getHomescreenOrder()

  // update the order, in case new views have been added/removed
  let order = updateViewOrder(savedOrder, defaultViewOrder)

  // return an action to save it to persistent storage
  return saveHomescreenOrder(order, {noTrack: true})
}
import {init} from './init'

export const saveHomescreenOrder = (order, options={}) => {
  options.noTrack || trackHomescreenOrder(order)
  storage.setHomescreenOrder(order)
  return {type: SAVE_HOMESCREEN_ORDER, payload: order}
}

const initialHomescreenState = {
  order: [],
}
function homescreen(state=initialHomescreenState, action) {
  let {type, payload} = action
  switch (type) {
    case SAVE_HOMESCREEN_ORDER: {
      return {...state, order: payload}
    }
    default:
      return state
  }
}


export const UPDATE_MENU_FILTERS = 'menus/UPDATE_MENU_FILTERS'

export const updateMenuFilters = (menuName: string, filters: any[]) => {
  trackMenuFilters(menuName, filters)
  return {type: UPDATE_MENU_FILTERS, payload: {menuName, filters}}
}

const initialMenusState = {}
function menus(state=initialMenusState, action) {
  let {type, payload} = action
  switch (type) {
    case UPDATE_MENU_FILTERS:
      return {...state, [payload.menuName]: payload.filters}
    default:
      return state
  }
}

export function aao(state={}, action) {
  return {
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
