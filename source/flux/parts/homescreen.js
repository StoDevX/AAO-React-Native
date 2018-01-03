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
  | SaveEnabledViewsAction
  | ToggleViewEnabledAction

const SAVE_HOMESCREEN_ORDER = 'homescreen/SAVE_HOMESCREEN_ORDER'
const SAVE_ENABLED_VIEWS = 'homescreen/SAVE_ENABLED_VIEWS'
const TOGGLE_VIEW_ENABLED = 'homescreen/TOGGLE_VIEW_ENABLED'

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

type SaveEnabledViewsAction = {
  type: 'homescreen/SAVE_ENABLED_VIEWS',
  payload: Array<ViewName>,
}
export function saveEnabledViews(
  enabledViews: Array<ViewName>,
): SaveEnabledViewsAction {
  storage.setEnabledViews(enabledViews)
  return {type: SAVE_ENABLED_VIEWS, payload: enabledViews}
}
export async function loadEnabledViews() {
  let enabledViews = await storage.getEnabledViews()

  if (enabledViews.length == 0) {
    enabledViews = defaultViewOrder
  }

  return saveEnabledViews(enabledViews)
}

type ToggleViewEnabledAction = {
  type: 'homescreen/TOGGLE_VIEW_ENABLED',
  payload: Array<string>,
}
export function toggleViewEnabled(
  viewName: string,
): ThunkAction<ToggleViewEnabledAction> {
  return (dispatch, getState) => {
    const state = getState()

    const currentEnabledViews = state.homescreen
      ? state.homescreen.activeViews
      : []

    const newEnabledViews = currentEnabledViews.includes(viewName)
      ? currentEnabledViews.filter(name => name !== viewName)
      : [...currentEnabledViews, viewName]

    // TODO: remove saving logic from reducers
    storage.setEnabledViews(newEnabledViews)

    dispatch({type: TOGGLE_VIEW_ENABLED, payload: newEnabledViews})
  }
}

export type State = {|
  order: Array<ViewName>,
  activeViews: Array<ViewName>,
|}

const initialState: State = {
  order: [],
  activeViews: [],
}

export function homescreen(state: State = initialState, action: Action) {
  switch (action.type) {
    case SAVE_HOMESCREEN_ORDER: {
      return {...state, order: action.payload}
    }
    case SAVE_ENABLED_VIEWS: {
      return {...state, activeViews: action.payload}
    }
    case TOGGLE_VIEW_ENABLED: {
      return {...state, activeViews: action.payload}
    }
    default: {
      return state
    }
  }
}
