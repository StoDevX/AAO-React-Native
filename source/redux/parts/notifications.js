// @flow

import {
	trackChannelSubscribe,
	trackChannelUnsubscribe,
	trackNotificationsDisable,
	trackNotificationsEnable,
} from '@frogpond/analytics'
import OneSignal from 'react-native-onesignal'

import {type ReduxState} from '../index'

type Dispatch<A: Action> = (action: A | Promise<A> | ThunkAction<A>) => any
type GetState = () => ReduxState
type ThunkAction<A: Action> = (dispatch: Dispatch<A>, getState: GetState) => any

export type NotificationChannelName =
	| 'channel:campus/emergency'
	| 'channel:cage/late-night-specials'
	| 'channel:pause/monthly-special'
	| 'channel:multimedia/weekly-movie'
	| 'channel:post-office/packages'
	| 'channel:sga/announcements'

const CHANNEL_SUBSCRIBE = 'notifications/CHANNEL_SUBSCRIBE'
const CHANNEL_UNSUBSCRIBE = 'notifications/CHANNEL_UNSUBSCRIBE'
const SET_CHANNELS = 'notifications/SET_CHANNELS'
const SET_PERMISSIONS = 'notifications/SET_PERMISSIONS'
const DISABLE = 'notifications/DISABLE'
const ENABLE = 'notifications/ENABLE'

type ChannelSubscribeAction = {|
	type: 'notifications/CHANNEL_SUBSCRIBE',
	payload: NotificationChannelName,
|}
export function subscribe(
	channelName: NotificationChannelName,
): ChannelSubscribeAction {
	OneSignal.sendTag(channelName, 'active')
	trackChannelSubscribe(channelName)
	return {type: CHANNEL_SUBSCRIBE, payload: channelName}
}

type ChannelUnsubscribeAction = {|
	type: 'notifications/CHANNEL_UNSUBSCRIBE',
	payload: NotificationChannelName,
|}
export function unsubscribe(
	channelName: NotificationChannelName,
): ChannelUnsubscribeAction {
	OneSignal.deleteTag(channelName)
	trackChannelUnsubscribe(channelName)
	return {type: CHANNEL_UNSUBSCRIBE, payload: channelName}
}

type ToggleChannelSubscriptionAction =
	| ChannelSubscribeAction
	| ChannelUnsubscribeAction
export function toggleSubscription(
	channelName: NotificationChannelName,
): ThunkAction<ToggleChannelSubscriptionAction> {
	return (dispatch, getState) => {
		let {notifications: {channels = new Set()} = {}} = getState()

		if (channels.has(channelName)) {
			dispatch(unsubscribe(channelName))
		} else {
			dispatch(subscribe(channelName))
		}
	}
}

type SetPermissionsAction = {|
	type: 'notifications/SET_PERMISSIONS',
	payload: {enabled: boolean, hasPrompted: boolean},
|}
type SetChannelsAction = {|
	type: 'notifications/SET_CHANNELS',
	payload: Set<NotificationChannelName>,
|}
export function hydrate(): ThunkAction<
	SetPermissionsAction | SetChannelsAction,
> {
	return dispatch => {
		OneSignal.getPermissionSubscriptionState(permissions => {
			dispatch({
				type: SET_PERMISSIONS,
				payload: {
					enabled: permissions.notificationsEnabled,
					hasPrompted: permissions.hasPrompted,
				},
			})
		})

		OneSignal.getTags(tags => {
			if (!tags) {
				return
			}

			if (tags.stack && tags.message) {
				// it's an error
				return
			}

			let channels: Set<any> = new Set(Object.keys(tags))
			dispatch({type: SET_CHANNELS, payload: channels})
		})
	}
}

type DisableNotificationsAction = {|
	type: 'notifications/DISABLE',
|}
function disable(): DisableNotificationsAction {
	OneSignal.setSubscription(false)
	trackNotificationsDisable()
	return {type: DISABLE}
}

type EnableNotificationsAction = {|
	type: 'notifications/ENABLE',
|}
function enable(): EnableNotificationsAction {
	OneSignal.setSubscription(true)
	trackNotificationsEnable()
	return {type: ENABLE}
}

export function prompt(): ThunkAction<
	EnableNotificationsAction | DisableNotificationsAction,
> {
	return dispatch => {
		OneSignal.promptForPushNotificationsWithUserResponse(result => {
			dispatch(result ? enable() : disable())
		})
	}
}

type Action =
	| ChannelSubscribeAction
	| ChannelUnsubscribeAction
	| SetPermissionsAction
	| SetChannelsAction
	| EnableNotificationsAction
	| DisableNotificationsAction

export type State = {|
	+enabled: boolean,
	+channels: Set<NotificationChannelName>,
	+hasPrompted: boolean,
|}

const initialState = {
	enabled: false,
	channels: new Set(),
	hasPrompted: false,
}

export function notifications(state: State = initialState, action: Action) {
	switch (action.type) {
		case CHANNEL_SUBSCRIBE: {
			let channels: Set<NotificationChannelName> = new Set(state.channels)
			channels.add(action.payload)
			return {...state, channels}
		}

		case CHANNEL_UNSUBSCRIBE: {
			let channels: Set<NotificationChannelName> = new Set(state.channels)
			channels.delete(action.payload)
			return {...state, channels}
		}

		case SET_CHANNELS: {
			return {...state, channels: action.payload}
		}

		case SET_PERMISSIONS:
			return {
				...state,
				enabled: action.payload.enabled,
				hasPrompted: action.payload.hasPrompted,
			}

		case ENABLE:
			return {...state, enabled: true, hasPrompted: true}

		case DISABLE:
			return {...state, enabled: false, hasPrompted: true}

		default:
			return state
	}
}
