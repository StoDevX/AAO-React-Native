import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'

import {isUITesting} from '@frogpond/launch-arguments'
import type {RootState} from '../store'

type State = {
	unofficialityAcknowledged: boolean
	devModeOverride: boolean
	enabledCalendarSources: string[]
	directoryResultsView: 'list' | 'tiles'
}

/**
 * The calendars an install starts with. The campus calendar plus Presence,
 * where the student organisations post: between them they are the whole of
 * what happens on campus, so both are on. UI test mode uses only the fixture
 * calendar.
 *
 * The one definition of that list. `initialState`, the two rehydration
 * fallbacks below, and the redux migration all read it, and a second copy
 * would let them drift.
 */
export const DEFAULT_CALENDAR_SOURCES: string[] = isUITesting ? ['uitest'] : ['stolaf', 'presence']

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	enabledCalendarSources: DEFAULT_CALENDAR_SOURCES,
	// Faces read faster than a list of names, so search results open as tiles.
	directoryResultsView: 'tiles',
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
			const enabledCalendarSources = state.enabledCalendarSources ?? DEFAULT_CALENDAR_SOURCES
			state.enabledCalendarSources = enabledCalendarSources.includes(payload)
				? enabledCalendarSources.filter((id) => id !== payload)
				: [...enabledCalendarSources, payload]
		},
		setDirectoryResultsView(state, {payload}: PayloadAction<'list' | 'tiles'>) {
			state.directoryResultsView = payload
		},
	},
})

export const {
	acknowledgeAcknowledgement,
	setDevModeOverride,
	toggleCalendarSource,
	setDirectoryResultsView,
} = slice.actions
export const reducer = slice.reducer

export const selectAcknowledgement = (state: RootState): State['unofficialityAcknowledged'] =>
	state.settings.unofficialityAcknowledged

export const selectDevModeOverride = (state: RootState): State['devModeOverride'] =>
	state.settings.devModeOverride

export const selectEnabledCalendarSources = (state: RootState): State['enabledCalendarSources'] =>
	state.settings.enabledCalendarSources ?? DEFAULT_CALENDAR_SOURCES

export const selectDirectoryResultsView = (state: RootState): State['directoryResultsView'] =>
	state.settings.directoryResultsView ?? initialState.directoryResultsView
