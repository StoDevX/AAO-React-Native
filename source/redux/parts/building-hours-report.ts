import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import type {BuildingType} from '../../views/building-hours/types'
import {
	buildingReducer,
	type BuildingAction,
} from '../../views/building-hours/report/building-reducer'

export type State = {
	building: BuildingType | null
	initialBuilding: BuildingType | null
}

const initialState: State = {
	building: null,
	initialBuilding: null,
}

const slice = createSlice({
	name: 'buildingHoursReport',
	initialState,
	reducers: {
		startReport(state, action: PayloadAction<BuildingType>) {
			state.building = action.payload
			state.initialBuilding = action.payload
		},
		clearReport(state) {
			state.building = null
			state.initialBuilding = null
		},
		applyBuildingAction(state, action: PayloadAction<BuildingAction>) {
			if (!state.building) {
				return
			}
			state.building = buildingReducer(state.building, action.payload)
		},
	},
})

export const {startReport, clearReport, applyBuildingAction} = slice.actions
export const reducer = slice.reducer

export const selectReportDraft = (state: RootState): State['building'] =>
	state.buildingHoursReport.building

export const selectReportHasUnsavedChanges = (state: RootState): boolean => {
	let {building, initialBuilding} = state.buildingHoursReport
	if (!building || !initialBuilding) {
		return false
	}
	return JSON.stringify(building) !== JSON.stringify(initialBuilding)
}
