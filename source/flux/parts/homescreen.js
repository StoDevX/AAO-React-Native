// @flow

import {allViewNames as defaultViewOrder} from '../../views/views'
import difference from 'lodash/difference'
import {trackHomescreenOrder} from '../../analytics'
import * as storage from '../../lib/storage'
import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action =
  | SaveViewOrderAction
  | SaveDisabledViewsAction
  | ToggleViewDisabledAction

const SAVE_HOMESCREEN_ORDER = 'homescreen/SAVE_HOMESCREEN_ORDER'
const SAVE_DISABLED_VIEWS = 'homescreen/SAVE_DISABLED_VIEWS'
const TOGGLE_VIEW_DISABLED = 'homescreen/TOGGLE_VIEW_DISABLED'

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

type SaveDisabledViewsAction = {
  type: 'homescreen/SAVE_DISABLED_VIEWS',
  payload: Array<ViewName>,
}
export function saveDisabledViews(
  disabledViews: Array<ViewName>,
): SaveDisabledViewsAction {
  storage.setDisabledViews(disabledViews)
  return {type: SAVE_DISABLED_VIEWS, payload: disabledViews}
}
export async function loadDisabledViews() {
  let disabledViews = await storage.getDisabledViews()

  if (disabledViews.length === 0) {
    disabledViews = []
  }

  disabledViews = disabledViews.filter(view => defaultViewOrder.includes(view))

  return saveDisabledViews(disabledViews)
}

type ToggleViewDisabledAction = {
  type: 'homescreen/TOGGLE_VIEW_DISABLED',
  payload: Array<string>,
}
export function toggleViewDisabled(
  viewName: string,
): ThunkAction<ToggleViewDisabledAction> {
  return (dispatch, getState) => {
    const state = getState()

    const currentDisabledViews = state.homescreen
      ? state.homescreen.inactiveViews
      : []
    const newDisabledViews = currentDisabledViews.includes(viewName)
      ? currentDisabledViews.filter(name => name !== viewName)
      : [...currentDisabledViews, viewName]

    // TODO: remove saving logic from reducers
    storage.setDisabledViews(newDisabledViews)

    dispatch({type: TOGGLE_VIEW_DISABLED, payload: newDisabledViews})
  }
}

export type State = {|
  order: Array<ViewName>,
  inactiveViews: Array<ViewName>,
|}

const initialState: State = {
  order: [],
  inactiveViews: [],
}

export function homescreen(state: State = initialState, action: Action) {
  switch (action.type) {
    case SAVE_HOMESCREEN_ORDER: {
      return {...state, order: action.payload}
    }
    case SAVE_DISABLED_VIEWS: {
      return {...state, inactiveViews: action.payload}
    }
    case TOGGLE_VIEW_DISABLED: {
      return {...state, inactiveViews: action.payload}
    }
    default: {
      return state
    }
  }
}
