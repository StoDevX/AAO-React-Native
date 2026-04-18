import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'

type State = {
	unofficialityAcknowledged: boolean
	devModeOverride: boolean
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
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
	},
})

export const {acknowledgeAcknowledgement, setDevModeOverride} = slice.actions
export const reducer = slice.reducer

export const selectAcknowledgement = (
	state: RootState,
): State['unofficialityAcknowledged'] =>
	state.settings.unofficialityAcknowledged

export const selectDevModeOverride = (
	state: RootState,
): State['devModeOverride'] => state.settings.devModeOverride
