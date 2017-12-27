// @flow

import * as storage from '../../lib/storage'

const SAVE_FAVORITE_BUILDINGS = 'buildings/SAVE_FAVORITE_BUILDINGS'

export async function loadFavoriteBuildings() {
  let favoriteBuildings = await storage.getFavoriteBuildings()
  return {type: SAVE_FAVORITE_BUILDINGS, payload: favoriteBuildings}
}

type SaveFavoriteBuildingsAction = {
  type: 'buildings/SAVE_FAVORITE_BUILDINGS',
  payload: Array<string>,
}

export function saveFavoriteBuildings(
  favoriteBuildings: Array<string>,
  newBuilding: string,
  navigation: Object,
): SaveFavoriteBuildingsAction {
  if (!favoriteBuildings.includes(newBuilding)) {
    favoriteBuildings.push(newBuilding)
  } else {
    const index = favoriteBuildings.indexOf(newBuilding)
    favoriteBuildings.splice(index, 1)
  }
  navigation.setParams({favoriteBuildings: favoriteBuildings})
  storage.setFavoriteBuildings(favoriteBuildings)
  return {type: SAVE_FAVORITE_BUILDINGS, payload: favoriteBuildings}
}

type Action = SaveFavoriteBuildingsAction

export type State = {|
  favoriteBuildings: Array<string>,
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
