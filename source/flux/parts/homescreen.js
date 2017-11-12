// @flow

import {allViewNames as defaultViewOrder} from '../../views/views'
import difference from 'lodash/difference'
import {trackHomescreenOrder} from '../../analytics'
import * as storage from '../../lib/storage'

const SAVE_HOMESCREEN_ORDER = 'homescreen/SAVE_HOMESCREEN_ORDER'

type ViewName = string

export function updateViewOrder(
  currentOrder: Array<ViewName>,
  defaultOrder: Array<ViewName> = defaultViewOrder,
): Array<ViewName> {
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

export async function loadHomescreenOrder() {
  // get the saved list from persistent storage
  let savedOrder = await storage.getHomescreenOrder()

  // update the order, in case new views have been added/removed
  let order = updateViewOrder(savedOrder, defaultViewOrder)

  // return an action to save it to persistent storage
  return saveHomescreenOrder(order, {noTrack: true})
}

type SaveViewOrderAction = {
  type: 'homescreen/SAVE_HOMESCREEN_ORDER',
  payload: Array<ViewName>,
}
export function saveHomescreenOrder(
  order: Array<ViewName>,
  options: {noTrack?: boolean} = {},
): SaveViewOrderAction {
  if (!options.noTrack) {
    trackHomescreenOrder(order)
  }

  storage.setHomescreenOrder(order)
  return {type: SAVE_HOMESCREEN_ORDER, payload: order}
}

type Action = SaveViewOrderAction

export type State = {|
  order: Array<ViewName>,
|}

const initialState: State = {
  order: [],
}

export function homescreen(state: State = initialState, action: Action) {
  switch (action.type) {
    case SAVE_HOMESCREEN_ORDER: {
      return {...state, order: action.payload}
    }
    default: {
      return state
    }
  }
}
