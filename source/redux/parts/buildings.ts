import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'

type State = {
	favorites: Array<string>
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	favorites: [],
} as State

const slice = createSlice({
	name: 'buildings',
	initialState,
	reducers: {
		toggleFavoriteBuilding(state, action: PayloadAction<string>) {
			let favoritesSet = new Set(state.favorites)

			if (favoritesSet.has(action.payload)) {
				favoritesSet.delete(action.payload)
			} else {
				favoritesSet.add(action.payload)
			}

			let newFavorites = Array.from(favoritesSet)

			// Sort the building names (localeCompare handles non-ASCII chars better)
			newFavorites.sort((a, b) => a.localeCompare(b))

			state.favorites = newFavorites
		},
	},
})

export const {toggleFavoriteBuilding} = slice.actions
export const reducer = slice.reducer

export const selectFavoriteBuildings = (state: RootState): State['favorites'] =>
	state.buildings.favorites
