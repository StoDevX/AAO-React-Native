import {createStore, applyMiddleware} from 'redux'
import createLogger from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'
import {AsyncStorage} from 'react-native'
import {allViewNames as defaultViewOrder} from '../views/views'
import difference from 'lodash/difference'

export const SAVE_HOMESCREEN_ORDER = 'SAVE_HOMESCREEN_ORDER'

export const loadHomescreenOrder = async () => {
  // get the saved list from asyncstorage
  // or, if the result is null, use the default order.
  let order = JSON.parse(await AsyncStorage.getItem('homescreen:view-order')) || defaultViewOrder
  // In case new screens have been added, get a list of the new screens
  let newAdditions = difference(order, defaultViewOrder)
  // add the new screens to the list
  order = order.concat(newAdditions)
  // check for removed screens
  let removedScreens = difference(defaultViewOrder, order)
  order = difference(order, removedScreens)

  return saveHomescreenOrder(order)
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

export function aao(state={}, action) {
  return {
    homescreen: homescreen(state.homescreen, action),
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
