import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'

export type State = {
	/** Master switch — when false, no notifications are delivered regardless of feature settings. */
	enabled: boolean
	/** Per-feature opt-in map. Keys are feature identifiers (e.g. "menus", "calendar"). */
	features: Record<string, boolean>
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	enabled: false,
	features: {},
} as State

const slice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		setNotificationsEnabled(state, {payload}: PayloadAction<boolean>) {
			state.enabled = payload
		},
		setFeatureNotificationEnabled(
			state,
			{payload}: PayloadAction<{featureId: string; enabled: boolean}>,
		) {
			state.features[payload.featureId] = payload.enabled
		},
	},
})

export const {setNotificationsEnabled, setFeatureNotificationEnabled} =
	slice.actions
export const reducer = slice.reducer

/** Whether the master notification toggle is on. */
export const selectNotificationsEnabled = (
	state: RootState,
): State['enabled'] => state.notifications.enabled

/** Whether a specific feature has notifications enabled (defaults to false). */
export const selectFeatureNotificationEnabled =
	(featureId: string) =>
	(state: RootState): boolean =>
		state.notifications.features[featureId] ?? false

/** Returns the list of feature IDs that have notifications explicitly enabled. */
export const selectEnabledFeatures = (state: RootState): Array<string> =>
	Object.entries(state.notifications.features)
		.filter(([, enabled]) => enabled)
		.map(([featureId]) => featureId)
		.sort()
