import {
	getAcknowledgementStatus,
	setAcknowledgementStatus,
} from '../../lib/storage'

import type {ReduxState} from '../index'

type Dispatch<A extends Action> = (
	action: A | Promise<A> | ThunkAction<A>,
) => void
type GetState = () => ReduxState
type ThunkAction<A extends Action> = (
	dispatch: Dispatch<A>,
	getState: GetState,
) => void

const CHANGE_THEME = 'settings/CHANGE_THEME'
const SIS_ALERT_SEEN = 'settings/SIS_ALERT_SEEN'

type ChangeThemeAction = {type: 'settings/CHANGE_THEME'; payload: string}

type SisAlertSeenAction = {type: 'settings/SIS_ALERT_SEEN'; payload: boolean}
export async function loadAcknowledgement(): Promise<SisAlertSeenAction> {
	return {type: SIS_ALERT_SEEN, payload: await getAcknowledgementStatus()}
}

export async function hasSeenAcknowledgement(): Promise<SisAlertSeenAction> {
	await setAcknowledgementStatus(true)
	return {type: SIS_ALERT_SEEN, payload: true}
}

type Action = SisAlertSeenAction | ChangeThemeAction

export type State = {
	readonly theme: string
	readonly dietaryPreferences: []
	readonly unofficiallyAcknowledged: boolean
}

const initialState: State = {
	theme: 'All About Olaf',
	dietaryPreferences: [],
	unofficiallyAcknowledged: false,
}

export function settings(state: State = initialState, action: Action): State {
	switch (action.type) {
		case CHANGE_THEME:
			return {...state, theme: action.payload}

		case SIS_ALERT_SEEN:
			return {...state, unofficiallyAcknowledged: action.payload}

		default:
			return state
	}
}
