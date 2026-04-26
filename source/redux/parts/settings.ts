import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {DEFAULT_TILE_SIZE, type TileSize} from '../../views/home/types'

export type State = {
	unofficialityAcknowledged: boolean
	devModeOverride: boolean
	homescreenSizes: Record<string, TileSize>
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	homescreenSizes: {},
} as State

const slice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		acknowledgeAcknowledgement(state, {payload}: PayloadAction<boolean>) {
			state.unofficialityAcknowledged = payload
		},
		setDevModeOverride(state, {payload}: PayloadAction<boolean>) {
			state.devModeOverride = payload
		},
		setHomescreenTileSize(
			state,
			{payload}: PayloadAction<{id: string; size: TileSize}>,
		) {
			state.homescreenSizes[payload.id] = payload.size
		},
		resetHomescreenSizes(state) {
			state.homescreenSizes = {}
		},
	},
})

export const {
	acknowledgeAcknowledgement,
	setDevModeOverride,
	setHomescreenTileSize,
	resetHomescreenSizes,
} = slice.actions
export const reducer = slice.reducer

export const selectAcknowledgement = (
	state: RootState,
): State['unofficialityAcknowledged'] =>
	state.settings.unofficialityAcknowledged

export const selectDevModeOverride = (
	state: RootState,
): State['devModeOverride'] => state.settings.devModeOverride

export const selectHomescreenSize =
	(id: string) =>
	(state: RootState): TileSize =>
		state.settings.homescreenSizes[id] ?? DEFAULT_TILE_SIZE
