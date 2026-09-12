import * as React from 'react'

import type {BuildingType} from '../types'
import {buildingReducer, type BuildingAction} from './building-reducer'

type Draft = {
	/** The building as it is being edited. */
	building: BuildingType
	/** The building as it arrived, to compare against for unsaved changes. */
	initialBuilding: BuildingType
}

type Action =
	| {type: 'START'; building: BuildingType}
	| {type: 'CLEAR'}
	| {type: 'EDIT'; edit: BuildingAction}

function draftReducer(state: Draft | null, action: Action): Draft | null {
	switch (action.type) {
		case 'START':
			return {building: action.building, initialBuilding: action.building}

		case 'CLEAR':
			return null

		case 'EDIT':
			return state ? {...state, building: buildingReducer(state.building, action.edit)} : state

		default: {
			let _exhaustive: never = action
			throw new Error(`Unhandled draft action: ${JSON.stringify(_exhaustive)}`)
		}
	}
}

type ContextValue = {
	draft: BuildingType | null
	hasUnsavedChanges: boolean
	start: (building: BuildingType) => void
	clear: () => void
	edit: (edit: BuildingAction) => void
}

const BuildingReportContext = React.createContext<ContextValue | null>(null)

/**
 * Holds the building being reported on for as long as the campus detail sheet
 * is up.
 *
 * The report screen and the schedule editor are separate routes in that
 * sheet's stack, so neither can own the draft outright -- the editor changes
 * one set of hours and the report screen has to see it. Mounting it on their
 * shared layout keeps the draft no wider than the two screens that edit it,
 * and closing the sheet throws it away.
 */
export function BuildingReportProvider(props: {children: React.ReactNode}): React.ReactNode {
	let [draft, dispatch] = React.useReducer(draftReducer, null)

	let value = React.useMemo(
		(): ContextValue => ({
			draft: draft?.building ?? null,
			hasUnsavedChanges: draft
				? JSON.stringify(draft.building) !== JSON.stringify(draft.initialBuilding)
				: false,
			start: (building) => {
				dispatch({type: 'START', building})
			},
			clear: () => {
				dispatch({type: 'CLEAR'})
			},
			edit: (edit) => {
				dispatch({type: 'EDIT', edit})
			},
		}),
		[draft],
	)

	return (
		<BuildingReportContext.Provider value={value}>{props.children}</BuildingReportContext.Provider>
	)
}

export function useBuildingReport(): ContextValue {
	let value = React.useContext(BuildingReportContext)
	if (!value) {
		throw new Error('useBuildingReport must be used within a BuildingReportProvider')
	}
	return value
}
