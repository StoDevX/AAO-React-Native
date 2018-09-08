// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import {ScrollView} from 'glamorous-native'
import {TableView, Section, CellToggle} from '@frogpond/tableview'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import flatten from 'lodash/flatten'
import type {ReduxState} from '../../../../redux'
import {prompt, toggleSubscription} from '../../../../redux/parts/notifications'
import {CheckForPushSettingsOnResume} from './on-resume'
import {IosNotificationSettingsButton} from './ios-settings-button'
import {
	notificationTypes,
	type NotificationChannel,
	type NotificationChannelName,
} from './channels'

type ReduxStateProps = {|
	+channels: Set<NotificationChannelName>,
	+enabled: boolean,
	+hasPrompted: boolean,
|}

type ReduxDispatchProps = {|
	+onChangeEnabledToggle: () => any,
	+onToggleChannel: (channelName: NotificationChannelName) => any,
|}

type Props = ReduxStateProps & ReduxDispatchProps

class PushNotificationsSettingsView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Notifications',
	}

	render() {
		let {
			enabled,
			hasPrompted,
			onChangeEnabledToggle,
			onToggleChannel,
			channels,
		} = this.props

		return (
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<CheckForPushSettingsOnResume />

				<TableView>
					{Platform.OS === 'ios' && (
						<IosNotificationSettingsButton
							hasPrompted={hasPrompted}
							onEnable={onChangeEnabledToggle}
							pushesEnabled={enabled}
						/>
					)}

					<ChannelsSection
						channels={channels}
						onToggleChannel={onToggleChannel}
						pushesEnabled={enabled}
					/>
				</TableView>
			</ScrollView>
		)
	}
}

function ChannelsSection({pushesEnabled, onToggleChannel, channels}) {
	let paired: Array<[string, Array<NotificationChannel>]> = toPairs(
		groupBy(notificationTypes, c => c.group),
	)

	let listItems = flatten(
		paired.map(([groupName, theseChannels]) =>
			theseChannels.map(channel => {
				// if the channel is forced, then we want to show the switch
				// as being "on", unless notifications are disabled, in which
				// case we can't send the forced notification, so we want to
				// show it as being "off".
				let forcedOn = channel.forced && pushesEnabled

				return (
					<CellToggle
						key={channel.key}
						detail={groupName}
						disabled={pushesEnabled === false || channel.forced}
						label={channel.label}
						onChange={() => onToggleChannel(channel.key)}
						value={forcedOn || channels.has(channel.key)}
					/>
				)
			}),
		),
	)

	return <Section header="CHANNELS">{listItems}</Section>
}

export const ConnectedPushNotificationsSettingsView = connect(
	(state: ReduxState): ReduxStateProps => ({
		channels: state.notifications ? state.notifications.channels : new Set(),
		enabled: state.notifications ? state.notifications.enabled : false,
		hasPrompted: state.notifications ? state.notifications.hasPrompted : false,
	}),
	(dispatch): ReduxDispatchProps => ({
		onChangeEnabledToggle: () => dispatch(prompt()),
		onToggleChannel: (name: NotificationChannelName) =>
			dispatch(toggleSubscription(name)),
	}),
)(PushNotificationsSettingsView)
