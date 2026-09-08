import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import type {Campus} from '../../features/building-hours/query'

/**
 * A favourited building, identified by campus AND name. St. Olaf and
 * Carleton run separate `spaces/hours` feeds that happen to share some venue
 * names (Bookstore, Post Office, ...) -- a bare name alone can't tell which
 * campus's venue was favourited.
 */
export type FavoriteBuilding = {
	campus: Campus
	name: string
}

export type State = {
	favorites: Array<FavoriteBuilding>
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	favorites: [],
} as State

function isSameFavorite(a: FavoriteBuilding, b: FavoriteBuilding): boolean {
	return a.campus === b.campus && a.name === b.name
}

const slice = createSlice({
	name: 'buildings',
	initialState,
	reducers: {
		toggleFavoriteBuilding(state, action: PayloadAction<FavoriteBuilding>) {
			let alreadyFavorited = state.favorites.some((favorite) =>
				isSameFavorite(favorite, action.payload),
			)

			let newFavorites = alreadyFavorited
				? state.favorites.filter((favorite) => !isSameFavorite(favorite, action.payload))
				: [...state.favorites, action.payload]

			// Sort the building names (localeCompare handles non-ASCII chars better)
			newFavorites.sort((a, b) => a.name.localeCompare(b.name))

			state.favorites = newFavorites
		},
	},
})

export const {toggleFavoriteBuilding} = slice.actions
export const reducer = slice.reducer

export const selectFavoriteBuildings = (state: RootState): State['favorites'] =>
	state.buildings.favorites

/** Whether `name` on `campus` is among `favorites`. */
export function isFavoriteBuilding(
	favorites: Array<FavoriteBuilding>,
	campus: Campus,
	name: string,
): boolean {
	return favorites.some((favorite) => favorite.campus === campus && favorite.name === name)
}
