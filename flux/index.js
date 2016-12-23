import {createStore, applyMiddleware} from 'redux'
import createLogger from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'
import {AsyncStorage} from 'react-native'
import {allViews} from '../views/views'

export const SAVE_HOMESCREEN_ORDER = 'SAVE_HOMESCREEN_ORDER'
let defaultViewOrder = allViews.map(v => v.view)

export const loadHomescreenOrder = async () => {
  let savedOrder = JSON.parse(await AsyncStorage.getItem('homescreen:view-order')) || defaultViewOrder
  return saveHomescreenOrder(savedOrder)
}

export const saveHomescreenOrder = order => {
  AsyncStorage.setItem('homescreen:view-order', JSON.stringify(order))
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
export const store = createStore(
  aao,
  applyMiddleware(
    reduxPromise,
    reduxThunk,
    logger
  )
)

store.dispatch(loadHomescreenOrder())
