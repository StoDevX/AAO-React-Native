// @flow

import {allViewNames as defaultViewOrder} from '../../views/views'
import difference from 'lodash/difference'
import {
	trackHomescreenOrder,
	trackHomescreenDisabledItem,
	trackHomescreenReenabledItem,
} from '../../analytics'
import * as storage from '../../lib/storage'
import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action =
	| SaveViewOrderAction
	| LoadDisabledViewsAction
	| ToggleViewDisabledAction
	| LoadViewOrderAction

const LOAD_HOMESCREEN_ORDER = 'homescreen/LOAD_HOMESCREEN_ORDER'
const SAVE_HOMESCREEN_ORDER = 'homescreen/SAVE_HOMESCREEN_ORDER'
const LOAD_DISABLED_VIEWS = 'homescreen/LOAD_DISABLED_VIEWS'
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

type LoadViewOrderAction = {
	type: 'homescreen/LOAD_HOMESCREEN_ORDER',
	payload: Array<ViewName>,
}
export async function loadHomescreenOrder(): Promise<LoadViewOrderAction> {
	// get the saved list from persistent storage
	let savedOrder = await storage.getHomescreenOrder()

	// update the order, in case new views have been added/removed
	let order = updateViewOrder(savedOrder, defaultViewOrder)

	// return an action to save it to persistent storage
	return {type: LOAD_HOMESCREEN_ORDER, payload: order}
}

type SaveViewOrderAction = {
	type: 'homescreen/SAVE_HOMESCREEN_ORDER',
	payload: Array<ViewName>,
}
export function saveHomescreenOrder(
	order: Array<ViewName>,
): SaveViewOrderAction {
	trackHomescreenOrder(order)
	storage.setHomescreenOrder(order)
	return {type: SAVE_HOMESCREEN_ORDER, payload: order}
}

type LoadDisabledViewsAction = {
	type: 'homescreen/LOAD_DISABLED_VIEWS',
	payload: Array<ViewName>,
}
export async function loadDisabledViews(): Promise<LoadDisabledViewsAction> {
	let disabledViews = await storage.getDisabledViews()

	if (disabledViews.length === 0) {
		disabledViews = []
	}

	disabledViews = disabledViews.filter(view => defaultViewOrder.includes(view))

	return {type: LOAD_DISABLED_VIEWS, payload: disabledViews}
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

		if (newDisabledViews.includes(viewName)) {
			trackHomescreenDisabledItem(viewName)
		} else {
			trackHomescreenReenabledItem(viewName)
		}
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
		case LOAD_HOMESCREEN_ORDER: {
			return {...state, order: action.payload}
		}
		case SAVE_HOMESCREEN_ORDER: {
			return {...state, order: action.payload}
		}
		case LOAD_DISABLED_VIEWS: {
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
