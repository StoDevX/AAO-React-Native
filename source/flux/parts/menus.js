// @flow

import {trackMenuFilters} from '../../analytics'

export const UPDATE_MENU_FILTERS = 'menus/UPDATE_MENU_FILTERS'

export const updateMenuFilters = (menuName: string, filters: any[]) => {
  trackMenuFilters(menuName, filters)
  return {type: UPDATE_MENU_FILTERS, payload: {menuName, filters}}
}

export type MenusState = {
  [key: string]: Array<any>,
}

const initialMenusState: MenusState = {}
export function menus(state: MenusState = initialMenusState, action: Object) {
  const {type, payload} = action

  switch (type) {
    case UPDATE_MENU_FILTERS:
      return {...state, [payload.menuName]: payload.filters}
    default:
      return state
  }
}
