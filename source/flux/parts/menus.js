// @flow

import {trackMenuFilters} from '../../analytics'
import {type FilterType} from '../../views/components/filter/types'

export const UPDATE_MENU_FILTERS = 'menus/UPDATE_MENU_FILTERS'

export type UpdateMenuFiltersAction = {
	type: 'menus/UPDATE_MENU_FILTERS',
	payload: {
		menuName: string,
		filters: Array<FilterType>,
	},
}
export function updateMenuFilters(
	menuName: string,
	filters: FilterType[],
): UpdateMenuFiltersAction {
	trackMenuFilters(menuName, filters)
	return {type: UPDATE_MENU_FILTERS, payload: {menuName, filters}}
}

export type Action = UpdateMenuFiltersAction

export type State = {
	+[key: string]: Array<FilterType>,
}

export function menus(state: State = {}, action: Action) {
	switch (action.type) {
		case UPDATE_MENU_FILTERS:
			return {
				...state,
				[action.payload.menuName]: action.payload.filters,
			}

		default:
			return state
	}
}
