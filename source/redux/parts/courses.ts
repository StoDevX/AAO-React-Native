import type {FilterType} from '@frogpond/filter'
import {
	formatFilterCombo,
	type FilterComboType,
} from '../../views/sis/course-search/lib/format-filter-combo'

import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import { CourseType } from '../../lib/course-search'

type State = {
	recentFilters: FilterComboType[]
	recentSearches: string[]
}

// why `as`? see https://redux-toolkit.js.org/tutorials/typescript#:~:text=In%20some%20cases%2C%20TypeScript
const initialState = {
	recentFilters: [],
	recentSearches: [],
} as State

const slice = createSlice({
	name: 'courses',
	initialState,
	reducers: {
		updateRecentFilters(state, action: PayloadAction<FilterType<CourseType>[]>) {
			const newRecentFilter = formatFilterCombo(action.payload)
			const recentFilters = state.recentFilters

			if (newRecentFilter.description.length === 0) {
				return
			}

			let newFilterIsRecent = recentFilters.find(
				(f) => f.description === newRecentFilter.description,
			)
			if (newFilterIsRecent) {
				return
			}

			state.recentFilters = [newRecentFilter, ...recentFilters].slice(0, 3)
		},
		updateRecentSearches(state, action: PayloadAction<string>) {
			let recentSearches = state.recentSearches
			let query = action.payload
			const recentLowerCase = recentSearches.map((query) => query.toLowerCase())
			if (recentLowerCase.includes(query.toLowerCase())) {
				return
			}
			state.recentSearches = [query, ...recentSearches].slice(0, 3)
		},
	},
})

export const {updateRecentFilters, updateRecentSearches} = slice.actions
export const reducer = slice.reducer

export const selectRecentFilters = (state: RootState): State['recentFilters'] =>
	state.courses.recentFilters

export const selectRecentSearches = (
	state: RootState,
): State['recentSearches'] => state.courses.recentSearches
