/**
 * @flow
 * Reducer for state for the homescreen
 */

import {homeViews} from '../../app/views'
import difference from 'lodash/difference'
import {trackHomescreenOrder} from '../../init/analytics'
import * as storage from '../../lib/storage'

const defaultViewOrder = homeViews.map(v => v.view)

export const SAVE_HOMESCREEN_ORDER = 'homescreen/SAVE_HOMESCREEN_ORDER'

export const updateViewOrder = (
  currentOrder: string[],
  defaultOrder: string[] = defaultViewOrder,
) => {
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

export const saveHomescreenOrder = (
  order: string[],
  options: {noTrack?: boolean} = {},
) => {
  options.noTrack || trackHomescreenOrder(order)
  storage.setHomescreenOrder(order)
  return {type: SAVE_HOMESCREEN_ORDER, payload: order}
}

const initialHomescreenState = {
  order: [],
}
export function homescreen(
  state: Object = initialHomescreenState,
  action: Object,
) {
  const {type, payload} = action

  switch (type) {
    case SAVE_HOMESCREEN_ORDER: {
      return {...state, order: payload}
    }
    default:
      return state
  }
}
