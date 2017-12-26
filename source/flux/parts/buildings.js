// @flow

import * as storage from '../../lib/storage'
import type {BuildingType} from '../../views/building-hours/types'

const SAVE_FAVORITE_BUILDINGS = 'buildings/SAVE_FAVORITE_BUILDINGS'

export async function loadFavoriteBuildings() {
  let favoriteBuildings = await storage.getFavoriteBuildings()
  return saveFavoriteBuildings(favoriteBuildings)
}

type SaveFavoriteBuildingsAction = {
  type: 'buildings/SAVE_FAVORITE_BUILDINGS',
  payload: Array<BuildingType>,
}

export function saveFavoriteBuildings(
  favoriteBuildings: Array<BuildingType>,
): SaveFavoriteBuildingsAction {
  storage.setFavoriteBuildings(favoriteBuildings)
  return {type: SAVE_FAVORITE_BUILDINGS, payload: favoriteBuildings}
}

type Action = SaveFavoriteBuildingsAction

export type State = {|
  favoriteBuildings: Array<BuildingType>,
|}

const initialState: State = {
  favoriteBuildings: [],
}

export function buildings(state: State = initialState, action: Action) {
  switch (action.type) {
    case SAVE_FAVORITE_BUILDINGS: {
      return {...state, favoriteBuildings: action.payload}
    }
    default: {
      return state
    }
  }
}
