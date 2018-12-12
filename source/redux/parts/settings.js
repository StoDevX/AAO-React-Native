// @flow

import {
	setAnalyticsOptOut,
	getAnalyticsOptOut,
	getAcknowledgementStatus,
	setAcknowledgementStatus,
} from '../../lib/storage'

import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

const SET_FEEDBACK = 'settings/SET_FEEDBACK'
const CHANGE_THEME = 'settings/CHANGE_THEME'
const SIS_ALERT_SEEN = 'settings/SIS_ALERT_SEEN'

type ChangeThemeAction = {|type: 'settings/CHANGE_THEME', payload: string|}

type SetFeedbackStatusAction = {|
	type: 'settings/SET_FEEDBACK',
	payload: boolean,
|}
export async function setFeedbackStatus(
	feedbackEnabled: boolean,
): Promise<SetFeedbackStatusAction> {
	await setAnalyticsOptOut(feedbackEnabled)
	return {type: SET_FEEDBACK, payload: feedbackEnabled}
}

export async function loadFeedbackStatus(): Promise<SetFeedbackStatusAction> {
	return {type: SET_FEEDBACK, payload: await getAnalyticsOptOut()}
}

type SisAlertSeenAction = {|type: 'settings/SIS_ALERT_SEEN', payload: boolean|}
export async function loadAcknowledgement(): Promise<SisAlertSeenAction> {
	return {type: SIS_ALERT_SEEN, payload: await getAcknowledgementStatus()}
}

export async function hasSeenAcknowledgement(): Promise<SisAlertSeenAction> {
	await setAcknowledgementStatus(true)
	return {type: SIS_ALERT_SEEN, payload: true}
}

type Action = SetFeedbackStatusAction | SisAlertSeenAction | ChangeThemeAction

export type State = {
	+theme: string,
	+dietaryPreferences: [],
	+feedbackDisabled: boolean,
	+unofficiallyAcknowledged: boolean,
}

const initialState = {
	theme: 'All About Olaf',
	dietaryPreferences: [],
	feedbackDisabled: false,
	unofficiallyAcknowledged: false,
}

export function settings(state: State = initialState, action: Action) {
	switch (action.type) {
		case CHANGE_THEME:
			return {...state, theme: action.payload}

		case SET_FEEDBACK:
			return {...state, feedbackDisabled: action.payload}

		case SIS_ALERT_SEEN:
			return {...state, unofficiallyAcknowledged: action.payload}

		default:
			return state
	}
}
