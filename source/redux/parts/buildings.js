// @flow

import * as storage from '../../lib/storage'
import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any
type Action = ToggleFavoriteAction | LoadFavoritesAction

const LOAD_FAVORITE_BUILDINGS = 'buildings/LOAD_FAVORITE_BUILDINGS'
const TOGGLE_FAVORITE_BUILDING = 'buildings/TOGGLE_FAVORITE_BUILDING'

type LoadFavoritesAction = {
	type: 'buildings/LOAD_FAVORITE_BUILDINGS',
	payload: Array<string>,
}
export async function loadFavoriteBuildings(): Promise<LoadFavoritesAction> {
	const favoriteBuildings = await storage.getFavoriteBuildings()
	return {type: LOAD_FAVORITE_BUILDINGS, payload: favoriteBuildings}
}

type ToggleFavoriteAction = {
	type: 'buildings/TOGGLE_FAVORITE_BUILDING',
	payload: Array<string>,
}
export function toggleFavoriteBuilding(
	buildingName: string,
): ThunkAction<ToggleFavoriteAction> {
	return (dispatch, getState) => {
		const state = getState()

		const currentFavorites = state.buildings ? state.buildings.favorites : []

		const newFavorites = currentFavorites.includes(buildingName)
			? currentFavorites.filter(name => name !== buildingName)
			: [...currentFavorites, buildingName]

		// Sort the building names (localeCompare handles non-ASCII chars better)
		newFavorites.sort((a, b) => a.localeCompare(b))

		// TODO: remove saving logic from reducers
		storage.setFavoriteBuildings(newFavorites)

		dispatch({type: TOGGLE_FAVORITE_BUILDING, payload: newFavorites})
	}
}

export type State = {|
	favorites: Array<string>,
|}

const initialState: State = {
	favorites: [],
}

export function buildings(state: State = initialState, action: Action) {
	switch (action.type) {
		case LOAD_FAVORITE_BUILDINGS:
		case TOGGLE_FAVORITE_BUILDING: {
			return {...state, favorites: action.payload}
		}
		default: {
			return state
		}
	}
}
