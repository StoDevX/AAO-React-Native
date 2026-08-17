import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'

type State = {
	unofficialityAcknowledged: boolean
	devModeOverride: boolean
	enabledCalendarSources: string[]
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	// St. Olaf alone: the college whose app this is, and the only calendar most
	// people want on by default.
	enabledCalendarSources: ['stolaf'],
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
		toggleCalendarSource(state, {payload}: PayloadAction<string>) {
			// `autoMergeLevel1` (the default redux-persist reconciler) swaps this
			// whole slice in from storage rather than merging field-by-field, so
			// state persisted before this field existed rehydrates without it.
			const enabledCalendarSources =
				state.enabledCalendarSources ?? initialState.enabledCalendarSources
			state.enabledCalendarSources = enabledCalendarSources.includes(payload)
				? enabledCalendarSources.filter((id) => id !== payload)
				: [...enabledCalendarSources, payload]
		},
	},
})

export const {acknowledgeAcknowledgement, setDevModeOverride, toggleCalendarSource} = slice.actions
export const reducer = slice.reducer

export const selectAcknowledgement = (state: RootState): State['unofficialityAcknowledged'] =>
	state.settings.unofficialityAcknowledged

export const selectDevModeOverride = (state: RootState): State['devModeOverride'] =>
	state.settings.devModeOverride

export const selectEnabledCalendarSources = (state: RootState): State['enabledCalendarSources'] =>
	state.settings.enabledCalendarSources ?? initialState.enabledCalendarSources
