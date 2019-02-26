// @flow

import {
	getAcknowledgementStatus,
	setAcknowledgementStatus,
} from '../../lib/storage'

import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

const CHANGE_THEME = 'settings/CHANGE_THEME'
const SIS_ALERT_SEEN = 'settings/SIS_ALERT_SEEN'

type ChangeThemeAction = {|type: 'settings/CHANGE_THEME', payload: string|}

type SetFeedbackStatusAction = {|
	type: 'settings/SET_FEEDBACK',
	payload: boolean,
|}

type SisAlertSeenAction = {|type: 'settings/SIS_ALERT_SEEN', payload: boolean|}
export async function loadAcknowledgement(): Promise<SisAlertSeenAction> {
	return {type: SIS_ALERT_SEEN, payload: await getAcknowledgementStatus()}
}

export async function hasSeenAcknowledgement(): Promise<SisAlertSeenAction> {
	await setAcknowledgementStatus(true)
	return {type: SIS_ALERT_SEEN, payload: true}
}

type Action = SisAlertSeenAction | ChangeThemeAction

export type State = {
	+theme: string,
	+dietaryPreferences: [],
	+unofficiallyAcknowledged: boolean,
}

const initialState = {
	theme: 'All About Olaf',
	dietaryPreferences: [],
	unofficiallyAcknowledged: false,
}

export function settings(state: State = initialState, action: Action) {
	switch (action.type) {
		case CHANGE_THEME:
			return {...state, theme: action.payload}

		case SIS_ALERT_SEEN:
			return {...state, unofficiallyAcknowledged: action.payload}

		default:
			return state
	}
}
