import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'

import type {RootState} from '../store'

type State = {
	/**
	 * The home groups a person has collapsed, by id. Kept as plain strings
	 * rather than `HomeGroupId`: a stored id can outlive the group it named, and
	 * one that matches nothing is simply never read.
	 */
	collapsedGroups: string[]
}

const initialState: State = {
	collapsedGroups: [],
}

const slice = createSlice({
	name: 'home',
	initialState,
	reducers: {
		toggleHomeGroup(state, {payload}: PayloadAction<string>) {
			state.collapsedGroups = state.collapsedGroups.includes(payload)
				? state.collapsedGroups.filter((id) => id !== payload)
				: [...state.collapsedGroups, payload]
		},
	},
})

export const {toggleHomeGroup} = slice.actions
export const reducer = slice.reducer

// An install that stored state before this slice existed rehydrates it as
// `initialState` -- `autoMergeLevel1` keeps any top-level key storage lacks --
// so it needs no migration.
export const selectCollapsedHomeGroups = (state: RootState): State['collapsedGroups'] =>
	state.home.collapsedGroups
