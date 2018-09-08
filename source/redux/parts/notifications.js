// @flow

import {} from '../../lib/storage'

import {
	trackChannelSubscribe,
	trackChannelUnsubscribe,
	trackNotificationsDisable,
	trackNotificationsEnable,
} from '@frogpond/analytics'
import OneSignal, {
	type SubscriptionState,
	type TagsObject,
} from 'react-native-onesignal'
import pify from 'pify'

const getOneSignalTags: () => Promise<TagsObject> = pify(OneSignal.getTags, {
	errorFirst: false,
})
const getOneSignalPermissions: () => Promise<SubscriptionState> = pify(
	OneSignal.getPermissionSubscriptionState,
	{errorFirst: false},
)
const promptOneSignalPushPermission: () => Promise<boolean> = pify(
	OneSignal.promptForPushNotificationsWithUserResponse,
	{errorFirst: false},
)

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
const CHANNELS_HYDRATE = 'notifications/CHANNELS_HYDRATE'
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

type HydrateChannelsAction = {|
	type: 'notifications/CHANNELS_HYDRATE',
	payload: {
		channels: Set<NotificationChannelName>,
		permissions: SubscriptionState,
	},
|}
export function hydrate(): ThunkAction<HydrateChannelsAction> {
	return async dispatch => {
		let [tags, permissions] = await Promise.all([
			getOneSignalTags(),
			getOneSignalPermissions(),
		])
		let channels = new Set(Object.keys(tags))
		dispatch({type: CHANNELS_HYDRATE, payload: {channels, permissions}})
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
	return async dispatch => {
		const permissionResult = await promptOneSignalPushPermission()
		dispatch(permissionResult ? enable() : disable())
	}
}

type Action =
	| ChannelSubscribeAction
	| ChannelUnsubscribeAction
	| HydrateChannelsAction
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

		case CHANNELS_HYDRATE:
			return {
				...state,
				channels: action.payload.channels,
				enabled: action.payload.permissions.notificationsEnabled,
				hasPrompted: action.payload.permissions.hasPrompted,
			}

		case ENABLE:
			return {...state, enabled: true, hasPrompted: true}

		case DISABLE:
			return {...state, enabled: false, hasPrompted: true}

		default:
			return state
	}
}
